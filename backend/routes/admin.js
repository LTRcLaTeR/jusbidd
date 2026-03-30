const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../auth");

// Middleware: check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.userId]
    );
    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

router.use(authenticate, requireAdmin);

// ============ STATS ============
router.get("/stats", async (req, res) => {
  try {
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");
    const activeAuctionsRes = await pool.query(
      "SELECT COUNT(*) FROM auctions WHERE status = 'active' AND end_time > NOW()"
    );
    const pendingRes = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE status = 'pending'"
    );
    const resolvedRes = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE status = 'resolved'"
    );
    const recentRes = await pool.query(
      `SELECT b.user_id, b.auction_id, b.bid_amount, b.bid_time, 'bid' as activity_type
       FROM bids b ORDER BY b.bid_time DESC LIMIT 10`
    );

    res.json({
      totalUsers: parseInt(usersRes.rows[0].count),
      activeAuctions: parseInt(activeAuctionsRes.rows[0].count),
      pendingReports: parseInt(pendingRes.rows[0].count),
      resolvedReports: parseInt(resolvedRes.rows[0].count),
      recentActivities: recentRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ AUCTIONS ============
router.get("/auctions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM auctions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ USERS ============
router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.display_name, u.username, u.email, r.name as role, u.status, u.created_at
      FROM users u JOIN roles r ON u.role_id = r.id
    `;
    let values = [];

    if (search) {
      values.push(parseInt(search) || 0);
      query += ` WHERE u.id = $1`;
    }

    query += " ORDER BY u.id ASC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.display_name, u.username, u.email, r.name as role, u.status, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.rows[0];

    // Get likes/dislikes
    const likesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'like'", [req.params.id]);
    const dislikesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'dislike'", [req.params.id]);
    user.likes = parseInt(likesRes.rows[0].count);
    user.dislikes = parseInt(dislikesRes.rows[0].count);

    if (user.role === 'seller') {
      const auctionsRes = await pool.query("SELECT COUNT(*) FROM auctions WHERE seller_id = $1", [req.params.id]);
      user.auction_count = parseInt(auctionsRes.rows[0].count);
    } else if (user.role === 'bidder') {
      const winsRes = await pool.query(
        `SELECT COUNT(DISTINCT a.id)
         FROM auctions a JOIN bids b ON a.id = b.auction_id
         WHERE a.end_time <= NOW() AND b.user_id = $1 AND b.bid_amount = a.current_bid`,
        [req.params.id]
      );
      user.win_count = parseInt(winsRes.rows[0].count);
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/suspend", async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.userId) {
      return res.status(400).json({ message: "ไม่สามารถระงับตัวเองได้" });
    }
    const check = await pool.query(
      "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [targetId]
    );
    if (check.rows.length > 0 && check.rows[0].role === "admin") {
      return res.status(400).json({ message: "ไม่สามารถระงับแอดมินได้" });
    }
    await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [targetId]);
    res.json({ message: "ระงับผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/activate", async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'active' WHERE id = $1", [req.params.id]);
    res.json({ message: "เปิดใช้งานผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/users/:id/message", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "กรุณากรอกข้อความ" });
    }
    // Admin sends message via messages table (auction_id = null not allowed, use a special system approach)
    // For simplicity, insert into messages with auction_id = null workaround
    await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
      [req.userId, req.params.id, content.trim()]
    );
    res.json({ message: "ส่งข้อความสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ REPORTS ============
router.get("/reports", async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT r.*,
        reporter.display_name as reporter_name, reporter.email as reporter_email,
        target.display_name as target_name, target.username as target_username
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users target ON r.target_id = target.id
    `;
    let values = [];

    if (search) {
      const searchId = parseInt(search) || 0;
      values.push(searchId);
      query += ` WHERE r.reporter_id = $1 OR r.target_id = $1`;
    }

    query += " ORDER BY r.created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/reports/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "resolved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await pool.query("UPDATE reports SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ message: "อัพเดทสถานะสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ AUCTION LOGS (BIDS) ============
router.get("/auction-logs", async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT b.id, b.auction_id, b.user_id, b.bid_amount, b.bid_time,
        CASE WHEN a.end_time <= NOW() THEN 'ended' ELSE 'active' END as log_status
      FROM bids b
      JOIN auctions a ON b.auction_id = a.id
    `;
    let values = [];

    if (search) {
      values.push(parseInt(search) || 0);
      query += ` WHERE b.user_id = $1`;
    }

    query += " ORDER BY b.bid_time DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
