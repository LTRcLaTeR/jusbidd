const jwt = require("jsonwebtoken");
const pool = require("./db");
const SECRET = "jusbidsecret";

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    // Check if user is suspended
    const result = await pool.query("SELECT status FROM users WHERE id = $1", [decoded.id]);
    if (result.rows.length > 0 && result.rows[0].status === 'suspended') {
      return res.status(403).json({ message: 'บัญชีของคุณถูกระงับ' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate, SECRET };
