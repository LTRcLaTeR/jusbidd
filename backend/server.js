const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { authenticate, SECRET } = require("./auth");
const initDatabase = require("./initDb");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // allow larger payloads for image uploads

// GET USER BY ID
app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await pool.query(
      "SELECT id, display_name, username, email, role_id FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { display_name, username, email, password, confirm_password, role } = req.body;

    if (!display_name || !username || !email || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบ"
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "รหัสผ่านไม่ตรงกัน"
      });
    }

    // เช็ค username / email ซ้ำ
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE username=$1 OR email=$2",
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username หรือ Email ถูกใช้งานแล้ว"
      });
    }

    // Email syntax check (simple)
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "รูปแบบอีเมลไม่ถูกต้อง"
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว" });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว" });
    }

    const hash = await bcrypt.hash(password, 10);

    const roleRes = await pool.query(
      "SELECT id FROM roles WHERE name=$1",
      [role]
    );

    if (roleRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "บทบาทไม่ถูกต้อง"
      });
    }

    const roleId = roleRes.rows[0].id;

    await pool.query(
      "INSERT INTO users (display_name, username, email, password, role_id) VALUES ($1,$2,$3,$4,$5)",
      [display_name, username, email, hash, roleId]
    );

    res.json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// LOGIN
app.post("/login", async (req, res) => {
  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบ"
      });
    }

    const result = await pool.query(
      "SELECT users.*, roles.name as role FROM users JOIN roles ON users.role_id=roles.id WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบผู้ใช้"
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้อง"
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token: token,
      role: user.role,
      id: user.id
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});

// GET CURRENT USER
app.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT u.id, u.display_name, u.username, u.email, u.profile_image, u.created_at, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE PROFILE
app.put("/update-profile", authenticate, async (req, res) => {
  try {
    const { display_name, email, password, profile_image } = req.body;
    
    if (!display_name || !email) {
      return res.status(400).json({ message: "display_name และ email จำเป็น" });
    }

    let query = "UPDATE users SET display_name = $1, email = $2";
    let values = [display_name, email];
    let paramIndex = 3;

    // ถ้าหากมีการเปลี่ยนรหัสผ่าน
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัว" });
      }
      const hash = await bcrypt.hash(password, 10);
      query += `, password = $${paramIndex}`;
      values.push(hash);
      paramIndex++;
    }

    // ถ้าหากมีการเปลี่ยนรูปโปรไฟล์
    if (profile_image !== undefined) {
      query += `, profile_image = $${paramIndex}`;
      values.push(profile_image);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex}`;
    values.push(req.userId);

    await pool.query(query, values);
    
    res.json({ message: "แก้ไขโปรไฟล์สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const auctionRoutes = require("./routes/auction");
app.use("/auctions", auctionRoutes);

const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

// ============ PUBLIC PROFILE ============

// Get public profile
app.get("/users/:userId/public-profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const userRes = await pool.query(
      `SELECT u.id, u.display_name, u.username, u.email, u.profile_image, u.created_at, r.name as role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    const user = userRes.rows[0];

    // Likes/dislikes
    const likesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'like'", [userId]);
    const dislikesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'dislike'", [userId]);

    const result = { ...user, likes: parseInt(likesRes.rows[0].count), dislikes: parseInt(dislikesRes.rows[0].count) };

    if (user.role === 'seller') {
      const auctionsRes = await pool.query("SELECT * FROM auctions WHERE seller_id = $1 ORDER BY created_at DESC", [userId]);
      result.auctions = auctionsRes.rows;
      result.auction_count = auctionsRes.rows.length;
    } else {
      const winsRes = await pool.query(
        `SELECT DISTINCT ON (a.id) a.*, b.bid_amount as winning_bid
         FROM auctions a JOIN bids b ON a.id = b.auction_id
         WHERE a.end_time <= NOW() AND b.user_id = $1 AND b.bid_amount = a.current_bid
         ORDER BY a.id, b.bid_time DESC`,
        [userId]
      );
      result.won_auctions = winsRes.rows;
      result.win_count = winsRes.rows.length;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Rate a user
app.post("/users/:userId/rate", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating } = req.body;
    if (!['like', 'dislike'].includes(rating)) return res.status(400).json({ message: "Invalid rating" });
    if (String(req.userId) === String(userId)) return res.status(400).json({ message: "ไม่สามารถให้คะแนนตัวเองได้" });

    await pool.query(
      `INSERT INTO user_ratings (rater_id, target_id, rating) VALUES ($1, $2, $3)
       ON CONFLICT (rater_id, target_id) DO UPDATE SET rating = $3`,
      [req.userId, userId, rating]
    );

    const likesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'like'", [userId]);
    const dislikesRes = await pool.query("SELECT COUNT(*) FROM user_ratings WHERE target_id = $1 AND rating = 'dislike'", [userId]);

    res.json({ likes: parseInt(likesRes.rows[0].count), dislikes: parseInt(dislikesRes.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get my rating for a user
app.get("/users/:userId/my-rating", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT rating FROM user_ratings WHERE rater_id = $1 AND target_id = $2",
      [req.userId, req.params.userId]
    );
    res.json({ rating: result.rows.length > 0 ? result.rows[0].rating : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit a report
app.post("/reports", authenticate, async (req, res) => {
  try {
    const { report_type, target_id, description } = req.body;
    if (!report_type || !target_id || !description) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }
    await pool.query(
      "INSERT INTO reports (reporter_id, target_id, report_type, description) VALUES ($1, $2, $3, $4)",
      [req.userId, target_id, report_type, description]
    );
    res.json({ message: "ส่งรายงานสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ MESSAGING ============

// Send a message
app.post("/messages", authenticate, async (req, res) => {
  try {
    const { auction_id, receiver_id, content } = req.body;
    if (!auction_id || !receiver_id || !content || !content.trim()) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }
    const result = await pool.query(
      "INSERT INTO messages (auction_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *",
      [auction_id, req.userId, receiver_id, content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a conversation (between current user and another user for an auction)
app.get("/messages/:auctionId/:otherUserId", authenticate, async (req, res) => {
  try {
    const { auctionId, otherUserId } = req.params;
    const result = await pool.query(
      `SELECT m.*, u.display_name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.auction_id = $1
         AND ((m.sender_id = $2 AND m.receiver_id = $3)
           OR (m.sender_id = $3 AND m.receiver_id = $2))
       ORDER BY m.created_at ASC`,
      [auctionId, req.userId, otherUserId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all conversations for the current user
app.get("/conversations", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (m.auction_id, other_user)
        m.auction_id,
        a.title as auction_title,
        a.image as auction_image,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user,
        u.display_name as other_user_name,
        m.content as last_message,
        m.created_at as last_message_time
       FROM messages m
       JOIN auctions a ON m.auction_id = a.id
       JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY other_user, m.auction_id, m.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});