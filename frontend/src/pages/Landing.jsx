import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import api from "../api";
import logo from "../assets/logo.png";
import "./CSS/Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    api.get("/auctions").then(res => setAuctions(res.data)).catch(() => {});
  }, []);

  const activeAuctions = auctions.filter(item => {
    const now = new Date();
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);
    return now >= start && now < end;
  });

  const formatPrice = (n) => Number(n || 0).toLocaleString();

  return (
    <div className="landing-container">
      {/* LEFT SIDE */}
      <div className="landing-left">
        {/* Top Nav */}
        <div className="landing-nav">
          <img src={logo} alt="logo" className="landing-nav-logo" />
          <span className="landing-nav-link" onClick={() => navigate("/home-bidder")}>หน้าแรก</span>
        </div>

        {/* Title */}
        <h1 className="landing-title"><em>Jus</em><sub>(tice)</sub> <em>Bid</em></h1>

        {/* Active Auctions Grid */}
        <div className="landing-auctions">
          {activeAuctions.length === 0 && (
            <p className="landing-empty">ไม่มีรายการประมูลที่เปิดอยู่ในขณะนี้</p>
          )}
          {activeAuctions.map(item => (
            <div key={item.id} className="landing-auction-card" onClick={() => navigate("/home-bidder")}>
              {item.image && <img src={item.image} alt={item.title} className="landing-auction-img" />}
              <div className="landing-auction-label">
                <span className="landing-auction-title">{item.title}</span>
                <span className="landing-auction-price">฿{formatPrice(item.current_bid > 0 ? item.current_bid : item.starting_price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="landing-right">
        <div className="landing-right-content">
          <div className="landing-user-circle">
            <FaUserCircle className="landing-user-icon" />
          </div>

          <button className="landing-btn-primary" onClick={() => navigate("/login")}>
            เข้าสู่ระบบตอนนี้?
          </button>

          <button className="landing-btn-secondary" onClick={() => navigate("/register")}>
            สมัครสมาชิกตอนนี้?
          </button>

          <span className="landing-guest-link" onClick={() => navigate("/home-bidder")}>
            ใช้งานเว็บไซล์แบบไม่เข้าสู่ระบบที่นี่
          </span>
        </div>
      </div>
    </div>
  );
}
