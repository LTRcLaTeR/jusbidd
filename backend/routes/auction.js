const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../auth");

// ดึงรายการประมูลทั้งหมด
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = `
      SELECT * FROM auctions
      WHERE status = 'active' AND end_time > NOW() - INTERVAL '1 day'
    `;

    let values = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` AND title ILIKE $${values.length}`;
    }

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/my-bids", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, a.title, a.image, a.starting_price, a.current_bid, a.bid_increment,
              a.start_time, a.end_time, a.category, a.seller_id, a.seller_username, a.description
       FROM bids b
       JOIN auctions a ON b.auction_id = a.id
       WHERE b.user_id = $1
       ORDER BY b.bid_time DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get auctions the bidder has won
router.get("/my-wins", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (a.id) a.*, b.bid_amount as winning_bid, u.display_name as winner_name
       FROM auctions a
       JOIN bids b ON a.id = b.auction_id
       JOIN users u ON b.user_id = u.id
       WHERE a.end_time <= NOW()
         AND b.user_id = $1
         AND b.bid_amount = a.current_bid
       ORDER BY a.id, b.bid_time DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/my-listings", authenticate, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = "SELECT * FROM auctions WHERE seller_id = $1";
    let values = [req.userId];

    if (search) {
      values.push(`%${search}%`);
      query += ` AND title ILIKE $${values.length}`;
    }

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET auction by ID (with winner info)
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM auctions WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Auction not found" });
    }
    const auction = result.rows[0];

    // Check if there are actual bids
    const bidCountRes = await pool.query("SELECT COUNT(*) FROM bids WHERE auction_id = $1", [auction.id]);
    auction.has_bids = parseInt(bidCountRes.rows[0].count) > 0;

    // If auction ended, find the winner (highest bidder)
    const now = new Date();
    const end = new Date(auction.end_time);
    if (now >= end) {
      const winnerRes = await pool.query(
        `SELECT b.user_id, b.bid_amount, u.display_name as winner_name
         FROM bids b JOIN users u ON b.user_id = u.id
         WHERE b.auction_id = $1
         ORDER BY b.bid_amount DESC LIMIT 1`,
        [auction.id]
      );
      if (winnerRes.rows.length > 0) {
        auction.winner_id = winnerRes.rows[0].user_id;
        auction.winner_name = winnerRes.rows[0].winner_name;
        auction.winning_bid = winnerRes.rows[0].bid_amount;
      }
    }

    res.json(auction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Place a bid
router.post("/:id/bid", authenticate, async (req, res) => {
  try {
    const auctionId = req.params.id;
    const { amount } = req.body;

    const auctionRes = await pool.query("SELECT * FROM auctions WHERE id = $1", [auctionId]);
    if (auctionRes.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการประมูล" });
    }

    const auction = auctionRes.rows[0];
    const now = new Date();
    const start = new Date(auction.start_time);
    const end = new Date(auction.end_time);

    if (now < start || now >= end) {
      return res.status(400).json({ message: "ไม่อยู่ในช่วงเวลาประมูล" });
    }

    const rawCurrentBid = Number(auction.current_bid);
    const bidIncrement = Number(auction.bid_increment) || 100;

    // Check if there are actual bids to determine minimum
    const bidCountRes = await pool.query("SELECT COUNT(*) FROM bids WHERE auction_id = $1", [auctionId]);
    const hasBids = parseInt(bidCountRes.rows[0].count) > 0;
    const minimumBid = hasBids ? rawCurrentBid + bidIncrement : Number(auction.starting_price);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount)) {
      return res.status(400).json({ message: "ระบบไม่รองรับการบิทแบบทศนิยม" });
    }

    if (parsedAmount < minimumBid) {
      return res.status(400).json({ message: `จำนวนเงินขั้นต่ำคือ ${minimumBid} บาท` });
    }

    // ตรวจสอบเวลาคงเหลือ ≤ 5 นาที → ต่อเวลาเพิ่ม 5 นาที
    const remainingMs = end - now;
    const fiveMinutes = 5 * 60 * 1000;
    let newEndTime = end;
    if (remainingMs <= fiveMinutes) {
      newEndTime = new Date(end.getTime() + fiveMinutes);
      await pool.query("UPDATE auctions SET current_bid = $1, end_time = $2 WHERE id = $3", [parsedAmount, newEndTime.toISOString(), auctionId]);
    } else {
      await pool.query("UPDATE auctions SET current_bid = $1 WHERE id = $2", [parsedAmount, auctionId]);
    }

    await pool.query(
      "INSERT INTO bids (user_id, auction_id, bid_amount) VALUES ($1, $2, $3)",
      [req.userId, auctionId, parsedAmount]
    );

    res.json({
      message: remainingMs <= fiveMinutes ? "บิทสำเร็จ (ต่อเวลาเพิ่ม 5 นาที)" : "บิทสำเร็จ",
      current_bid: parsedAmount,
      minimum_bid: parsedAmount + bidIncrement,
      end_time: newEndTime.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Edit auction title/description (only before start)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const auctionId = req.params.id;
    const { title, description } = req.body;

    const auctionRes = await pool.query("SELECT * FROM auctions WHERE id = $1", [auctionId]);
    if (auctionRes.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการประมูล" });
    }

    const auction = auctionRes.rows[0];

    if (auction.seller_id !== req.userId) {
      return res.status(403).json({ message: "คุณไม่ใช่เจ้าของรายการนี้" });
    }

    const now = new Date();
    const start = new Date(auction.start_time);
    if (now >= start) {
      return res.status(400).json({ message: "ไม่สามารถแก้ไขได้หลังเปิดประมูลแล้ว" });
    }

    const updates = [];
    const values = [];
    if (title !== undefined) {
      values.push(title);
      updates.push(`title = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description);
      updates.push(`description = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "ไม่มีข้อมูลที่ต้องแก้ไข" });
    }

    values.push(auctionId);
    await pool.query(`UPDATE auctions SET ${updates.join(", ")} WHERE id = $${values.length}`, values);

    res.json({ message: "แก้ไขสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, image, starting_price, category, bid_increment, start_time, end_time } = req.body;

    if (!title || !description || !starting_price || !category || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get seller username
    const userRes = await pool.query("SELECT username FROM users WHERE id=$1", [req.userId]);
    const sellerUsername = userRes.rows[0]?.username || "";

    const startTimeValue = start_time && start_time.trim() !== '' ? start_time : null;
    const endTimeValue = end_time && end_time.trim() !== '' ? end_time : null;

    const startingPrice = Math.round(Number(starting_price));
    const bidIncrementValue = Math.round(Number(bid_increment)) || 100;

    if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
      return res.status(400).json({ message: "ราคาเริ่มต้นไม่ถูกต้อง" });
    }

    const result = await pool.query(
      "INSERT INTO auctions (title, description, image, starting_price, current_bid, category, seller_id, seller_username, bid_increment, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [title, description, image || '', startingPrice, 0, category, req.userId, sellerUsername, bidIncrementValue, startTimeValue, endTimeValue]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;