import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaArrowRight } from "react-icons/fa";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "./CSS/Login.css";
import logo from "../assets/logo.png";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [fieldError, setFieldError] = useState({});
  const [serverError, setServerError] = useState("");

  const handleLogin = async () => {
    let errors = {};

    if (!form.username) {
      errors.username = "โปรดกรอกชื่อผู้ใช้ของคุณ";
    }

    if (!form.password) {
      errors.password = "โปรดกรอกรหัสผ่านของคุณ";
    }

    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      return;
    }

    try {
      setFieldError({});
      setServerError("");

      const res = await api.post("/login", form);
      const { token, role, id } = res.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userId", id);
      sessionStorage.setItem("role", role);

      if (role === "seller") navigate("/home-seller");
      else if (role === "admin") navigate("/admin");
      else navigate("/home-bidder");

    } catch (err) {
      setServerError(
        err.response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      );
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <img src={logo} alt="big logo" className="big-logo" />
        <h2 className="brand-name">Jus(tice) Bid</h2>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-box">

          <img src={logo} alt="small logo" className="small-logo" />
          <h2 className="login-title">เข้าสู่ระบบ</h2>

          {serverError && (
            <div className="server-error">
              {serverError}
            </div>
          )}

          {/* USERNAME */}
          <div className="field-wrapper">
            {fieldError.username && (
              <div className="field-error">
                * {fieldError.username}
              </div>
            )}

            <div className={`input-group ${fieldError.username ? "error-border" : ""}`}>
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="กรอกอีเมลของคุณ"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="field-wrapper">
            {fieldError.password && (
              <div className="field-error">
                * {fieldError.password}
              </div>
            )}

            <div className={`input-group ${fieldError.password ? "error-border" : ""}`}>
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่านของคุณ"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            ยืนยัน
          </button>

          <div className="register-text">
            หากยังไม่มีบัญชี <FaArrowRight />{" "}
            <Link to="/register">สมัครสมาชิกที่นี่</Link>
          </div>

        </div>
      </div>
    </div>
  );
}