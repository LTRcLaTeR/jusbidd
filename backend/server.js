const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { authenticate, SECRET } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // allow larger payloads for image uploads

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
      "SELECT id, display_name, username, email, role_id FROM users WHERE id = $1",
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
    const { display_name, email, password } = req.body;
    
    if (!display_name || !email) {
      return res.status(400).json({ message: "display_name และ email จำเป็น" });
    }

    let query = "UPDATE users SET display_name = $1, email = $2";
    let values = [display_name, email];

    // ถ้าหากมีการเปลี่ยนรหัสผ่าน
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัว" });
      }
      const hash = await bcrypt.hash(password, 10);
      query += ", password = $3";
      values.push(hash);
    }

    query += ` WHERE id = $${values.length + 1}`;
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

// ============ MESSAGING ============

// Send a message
app.post("/messages", authenticate, async (req, res) => {
  try {
    const { auction_id, receiver_id, content, image } = req.body;
    if (!auction_id || !receiver_id) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }
    if ((!content || !content.trim()) && !image) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }
    const result = await pool.query(
      "INSERT INTO messages (auction_id, sender_id, receiver_id, content, image) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [auction_id, req.userId, receiver_id, content ? content.trim() : '', image || null]
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

// ============ ADMIN ROUTES ============

// Admin middleware
const adminOnly = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin: get dashboard stats
app.get("/admin/stats", adminOnly, async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const activeAuctions = await pool.query("SELECT COUNT(*) FROM auctions WHERE status = 'active' AND end_time > NOW()");
    const reportsCount = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE status = 'pending') as pending, COUNT(*) FILTER (WHERE status = 'resolved') as resolved FROM reports"
    );
    const recentActivities = await pool.query(
      `SELECT b.id, b.auction_id, b.user_id, b.bid_amount, b.bid_time,
              a.title as auction_title, a.current_bid,
              u.display_name as user_name,
              CASE WHEN b.bid_amount = a.current_bid AND a.end_time <= NOW() THEN 'auto-close' ELSE 'bid' END as activity_type
       FROM bids b
       JOIN auctions a ON b.auction_id = a.id
       JOIN users u ON b.user_id = u.id
       ORDER BY b.bid_time DESC LIMIT 10`
    );
    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      activeAuctions: parseInt(activeAuctions.rows[0].count),
      pendingReports: parseInt(reportsCount.rows[0].pending || 0),
      resolvedReports: parseInt(reportsCount.rows[0].resolved || 0),
      recentActivities: recentActivities.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: get all auctions (for live preview)
app.get("/admin/auctions", adminOnly, async (req, res) => {
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

// Admin: get all users
app.get("/admin/users", adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT u.id, u.display_name, u.username, u.email, r.name as role, COALESCE(u.status, 'offline') as status
                 FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name != 'admin'`;
    let values = [];
    if (search) {
      values.push(search);
      query += ` AND (u.id::text = $${values.length} OR u.username ILIKE '%' || $${values.length} || '%')`;
    }
    query += " ORDER BY u.id ASC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: suspend user
app.put("/admin/users/:id/suspend", adminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'suspended' WHERE id = $1", [req.params.id]);
    res.json({ message: "ระงับผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: activate user
app.put("/admin/users/:id/activate", adminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'offline' WHERE id = $1", [req.params.id]);
    res.json({ message: "เปิดใช้งานผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: get all reports
app.get("/admin/reports", adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT r.*, u.display_name as reporter_name
                 FROM reports r
                 JOIN users u ON r.reporter_id = u.id`;
    let values = [];
    if (search) {
      values.push(search);
      query += ` WHERE r.id::text = $${values.length}`;
    }
    query += " ORDER BY r.created_at DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: update report status
app.put("/admin/reports/:id", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query("UPDATE reports SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ message: "อัพเดทสถานะสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: get auction logs (bid history)
app.get("/admin/auction-logs", adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT b.id, b.auction_id, b.user_id, b.bid_amount, b.bid_time,
                        a.title as auction_title, a.current_bid, a.end_time,
                        u.display_name as user_name,
                        CASE WHEN b.bid_amount = a.current_bid AND a.end_time <= NOW() THEN 'ปิดราคาสุดท้าย' ELSE 'bid' END as log_status
                 FROM bids b
                 JOIN auctions a ON b.auction_id = a.id
                 JOIN users u ON b.user_id = u.id`;
    let values = [];
    if (search) {
      values.push(search);
      query += ` WHERE u.id::text = $${values.length} OR u.display_name ILIKE '%' || $${values.length} || '%'`;
    }
    query += " ORDER BY b.bid_time DESC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit a report (for users)
app.post("/reports", authenticate, async (req, res) => {
  try {
    const { report_type, target_id, description } = req.body;
    if (!report_type || !target_id) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }
    const result = await pool.query(
      "INSERT INTO reports (report_type, reporter_id, target_id, description) VALUES ($1, $2, $3, $4) RETURNING *",
      [report_type, req.userId, target_id, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(5000, () => console.log("Backend running on port 5000"));