import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import api from "../api";
import Navbar from "../components/Navbar";
import AuctionCard from "../components/AuctionCard";
import "./CSS/ProfileBidder.css";

export default function Profile() {

  const [user, setUser] = useState({ display_name: "", email: "" });
  const [bids, setBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);

  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUser();
    fetchBids();
    fetchWonAuctions();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data);

      setForm({
        display_name: res.data.display_name,
        email: res.data.email,
        password: "",
        confirmPassword: ""
      });

    } catch (err) {
      console.error(err);
    }
  };

  const fetchBids = async () => {
    try {
      const res = await api.get("/auctions/my-bids");
      setBids(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWonAuctions = async () => {
    try {
      const res = await api.get("/auctions/my-wins");
      setWonAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async () => {
    setError("");
    setSuccess("");

    if (!form.display_name || !form.email) {
      setError("ชื่อและอีเมลจำเป็น");
      return;
    }

    if (form.password && form.password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัว");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const res = await api.put("/update-profile", {
        display_name: form.display_name,
        email: form.email,
        password: form.password || undefined
      });

      setSuccess(res.data.message || "แก้ไขสำเร็จ");
      setTimeout(() => {
        setShowEdit(false);
        setSuccess("");
        fetchUser();
      }, 1500);

    } catch (err) {
      const message = err.response?.data?.message || "ไม่สามารถแก้ไขได้";
      setError(message);
    }
  };

  return (
    <>
      <Navbar />

      <div className="profile-header">

        <div className="avatar">
          <FaUser />
        </div>

        <h2>{user.display_name}</h2>

        <p>จำนวนการประมูล: {bids.length}</p>

        <button
          className="edit-btn"
          onClick={() => setShowEdit(true)}
        >
          แก้ไขโปรไฟล์
        </button>

      </div>

      <div className="profile-container">

        <h3>รายการที่ประมูลชนะ</h3>

        <div className="auction-grid">
          {wonAuctions.length > 0 ? (
            wonAuctions.map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))
          ) : (
            <p>ยังไม่มีรายการที่ชนะ</p>
          )}
        </div>

        <h3 style={{ marginTop: 30 }}>ประวัติการประมูล</h3>

        <div className="auction-grid">
          {bids.length > 0 ? (
            bids.map((bid) => (
              <div key={bid.id} className="auction-card">
                <img src={bid.image} alt={bid.title} />
                <div className="card-info">
                  <p>{bid.title}</p>
                  <p>ราคาที่ประมูล {bid.bid_amount} บาท</p>
                </div>
              </div>
            ))
          ) : (
            <p>ยังไม่มีประวัติ</p>
          )}
        </div>

      </div>

      {/* POPUP EDIT PROFILE */}

      {showEdit && (
        <div className="modal-overlay">

          <div className="edit-modal">

            <div className="modal-header">
              <button className="save-btn" onClick={updateProfile}>
                แก้ไข
              </button>

              <span
                className="close-btn"
                onClick={() => setShowEdit(false)}
              >
                ✕
              </span>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <label>ชื่อที่แสดง:</label>
            <input
              value={form.display_name}
              onChange={(e) =>
                setForm({ ...form, display_name: e.target.value })
              }
            />

            <label>อีเมล:</label>
            <input
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <label>รหัสผ่าน:</label>
            <input
              type="password"
              placeholder="เปลี่ยนรหัสผ่าน..."
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <label>ยืนยันรหัสผ่าน:</label>
            <input
              type="password"
              placeholder="ยืนยันการเปลี่ยนรหัสผ่าน..."
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />

          </div>

        </div>
      )}
    </>
  );
}