const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "jusbidsecret";

// REGISTER
app.post("/register", async (req, res) => {
  const { display_name, username, email, password, confirm_password, role } = req.body;

  if (!display_name || !username || !email || !password || !confirm_password)
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

  if (password !== confirm_password)
    return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

  const hash = await bcrypt.hash(password, 10);

  const roleRes = await pool.query("SELECT id FROM roles WHERE name=$1", [role]);
  const roleId = roleRes.rows[0].id;

  await pool.query(
    "INSERT INTO users (display_name, username, email, password, role_id) VALUES ($1,$2,$3,$4,$5)",
    [display_name, username, email, hash, roleId]
  );

  res.json({ message: "สมัครสำเร็จ" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

  const result = await pool.query(
    "SELECT users.*, roles.name as role FROM users JOIN roles ON users.role_id=roles.id WHERE username=$1",
    [username]
  );

  if (result.rows.length === 0)
    return res.status(400).json({ message: "ไม่พบผู้ใช้" });

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(400).json({ message: "รหัสผ่านผิด" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  // return token, role and user id so frontend can use the id directly
  res.json({ token, role: user.role, id: user.id });
});

const auctionRoutes = require("./routes/auction");
app.use("/api/auctions", auctionRoutes);

app.listen(5000, () => console.log("Backend running"));