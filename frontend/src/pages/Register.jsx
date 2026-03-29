import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "./CSS/Register.css";
import logo from "../assets/logo.png";

export default function Register() {

  const [form, setForm] = useState({
    display_name: "",
    email: "",
    username: "",
    password: "",
    confirm_password: "",
    role: ""
  });

  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.display_name) newErrors.display_name = "โปรดกรอกชื่อของคุณ";
    if (!form.email) {
      newErrors.email = "โปรดกรอกอีเมลของคุณ";
    } else {
      // Email syntax check
      const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailPattern.test(form.email)) {
        newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }
    if (!form.username) newErrors.username = "โปรดกรอกชื่อผู้ใช้";
    if (!form.password) newErrors.password = "โปรดกรอกรหัสผ่านของคุณ";
    if (!form.confirm_password) newErrors.confirm_password = "โปรดยืนยันรหัสผ่านของคุณ";

    if (form.password) {
      if (form.password.length < 8) {
        newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
      } else if (!/[a-z]/.test(form.password)) {
        newErrors.password = "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว";
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password = "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว";
      } else if (!/[0-9]/.test(form.password)) {
        newErrors.password = "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
      }
    }

    if (form.password !== form.confirm_password) {
      newErrors.confirm_password = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    // create summary popup for any validation errors
    if (Object.keys(newErrors).length > 0) {
      setPopup(Object.values(newErrors).join(" \n"));
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return; // popup already set inside validate
    try {
      await api.post("/register", form);
      navigate("/login");
    } catch (err) {
      // build reason message using server response or error details
      let message = "ไม่สามารถสมัครสมาชิกได้";
      if (err.response && err.response.data && err.response.data.message) {
        message = err.response.data.message;
      } else if (err.message) {
        // network or other error
        message = err.message;
      }
      setPopup(message);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        {popup && (
  <div className="popup-overlay">
    <div className="popup-box">

      <h3>แจ้งเตือน</h3>
      <p>{popup}</p>

      <button onClick={() => setPopup("")}>
        ปิด
      </button>

    </div>
  </div>
)}
        <div className="logo-section">
          <img src={logo} alt="logo" />
          <h1>Jus(tice) Bid</h1>
        </div>

        <h2>สมัครสมาชิก</h2>

        <label>ชื่อที่แสดง:</label>
        <input
          placeholder="กรอกชื่อที่แสดงของคุณ"
          value={form.display_name}
          onChange={e => setForm({ ...form, display_name: e.target.value })}
        />
        {errors.display_name && <p className="error">* {errors.display_name}</p>}

        <label>อีเมล:</label>
        <input
          type="email"
          placeholder="กรอกอีเมลของคุณ"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && <p className="error">* {errors.email}</p>}

        <label>ชื่อผู้ใช้:</label>
        <input
          placeholder="กรอกชื่อผู้ใช้ของคุณ"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        {errors.username && <p className="error">* {errors.username}</p>}

        <label>รหัสผ่าน:</label>
        <div className="register-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="รหัสผ่านของคุณ"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <span
            className="register-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </span>
        </div>
        {errors.password && <p className="error">* {errors.password}</p>}

        <div className="password-hint">
          <ul>
            <li>รหัสผ่านควรยาวอย่างน้อย 8 ตัวอักษร</li>
            <li>ควรมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว</li>
            <li>ควรมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว</li>
            <li>ควรมีตัวเลขอย่างน้อย 1 ตัว</li>
          </ul>
        </div>

        <label>ยืนยันรหัสผ่าน:</label>
        <div className="register-password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="ยืนยันรหัสผ่านของคุณ"
            value={form.confirm_password}
            onChange={e => setForm({ ...form, confirm_password: e.target.value })}
          />
          <span
            className="register-toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </span>
        </div>
        {errors.confirm_password && <p className="error">* {errors.confirm_password}</p>}

        <label>บทบาท:</label>
        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="">เลือก Role</option>
          <option value="bidder">Bidder</option>
          <option value="seller">Seller</option>
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