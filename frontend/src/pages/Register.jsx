import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import logo from "../assets/logo.png";

export default function Register() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (form.password !== form.confirm_password) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      await api.post("/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">

        {/* LOGO */}
        <div className="logo-section">
          <img src={logo} alt="logo" />
          <h1>Jus(tice) Bid</h1>
        </div>

        <h2>สมัครสมาชิก</h2>

        {error && <p className="error">{error}</p>}

        <label>ชื่อที่แสดง:</label>
        <input
          placeholder="กรอกชื่อที่แสดงของคุณ"
          onChange={e => setForm({ ...form, display_name: e.target.value })}
        />

        <label>อีเมล์:</label>
        <input
          placeholder="กรอกอีเมล์ของคุณ"
          type="email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <label>ชื่อผู้ใช้:</label>
        <input
          placeholder="กรอกชื่อผู้ใช้ของคุณ"
          onChange={e => setForm({ ...form, username: e.target.value })}
        />

        <label>รหัสผ่าน:</label>
        <input
          type="password"
          placeholder="รหัสผ่านของคุณ"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <div className="password-hint">
          <ul>
            <li>รหัสผ่านควรยาวอย่างน้อย 8 ตัวอักษร</li>
            <li>ควรมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว</li>
            <li>ควรมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว</li>
            <li>ควรมีตัวเลขอย่างน้อย 1 ตัว</li>
          </ul>
        </div>

        <label>ยืนยันรหัสผ่าน:</label>
        <input
          type="password"
          placeholder="ยืนยันรหัสผ่านของคุณ"
          onChange={e => setForm({ ...form, confirm_password: e.target.value })}
        />

        <label>บทบาท:</label>
        <select
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="">เลือก Role</option>
          <option value="bidder">Bidder</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>

        <p className="login-link">
          หากมีบัญชีอยู่แล้ว → <Link to="/login">เข้าสู่ระบบที่นี่</Link>
        </p>

        <div className="button-group">
          <button className="primary" onClick={handleSubmit}>
            สร้างบัญชี
          </button>
          <button className="secondary" onClick={() => navigate("/")}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}