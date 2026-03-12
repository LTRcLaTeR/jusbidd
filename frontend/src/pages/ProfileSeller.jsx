import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import Navbar from "../components/Navbar";
import AuctionCard from "../components/AuctionCard";
import FloatingChat from "../components/FloatingChat";
import api from "../api";

const ProfileSeller = () => {
  const [user, setUser] = useState({});
  const [form, setForm] = useState({ display_name: "", email: "", password: "", confirmPassword: "" });
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeListings, setActiveListings] = useState([]);
  const [historyListings, setHistoryListings] = useState([]);


  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user.id) {
      fetchListings();
    }
  }, [user.id]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/me");
      setUser(res.data);
      setForm(prev => ({
        ...prev,
        display_name: res.data.display_name || "",
        email: res.data.email || ""
      }));
    } catch (err) {
      setUser({});
    }
  };

  const fetchListings = async () => {
    try {
      const res = await api.get("/auctions/my-listings");
      const myAuctions = res.data;
      const now = new Date();

      // แสดงรายการของ seller ให้ครบถ้วน: ทั้งก่อนเวลาเปิดและกำลังประมูล
      setActiveListings(
        myAuctions.filter(a => {
          const end = new Date(a.end_time);
          return end > now;
        })
      );

      // ประวัติรายการที่ปิดประมูลแล้ว
      setHistoryListings(
        myAuctions.filter(a => {
          const end = new Date(a.end_time);
          return end <= now;
        })
      );
    } catch (err) {
      setActiveListings([]);
      setHistoryListings([]);
    }
  };

  const updateProfile = async () => {
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
        <div className="profile-info">
          <h2>{user.display_name}</h2>
          <p>{user.email}</p>
        </div>
        <button className="edit-btn" onClick={() => setShowEdit(true)}>
          แก้ไขโปรไฟล์
        </button>
      </div>
      {showEdit && (
        <div className="edit-popup">
          <div className="edit-card">
            <h3>แก้ไขโปรไฟล์</h3>
            <input
              placeholder="ชื่อที่แสดง"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
            />
            <input
              placeholder="อีเมล"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="รหัสผ่านใหม่ (ถ้าเปลี่ยน)"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่าน"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
            />
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <div className="edit-actions">
              <button className="primary" onClick={updateProfile}>บันทึก</button>
              <button className="secondary" onClick={() => setShowEdit(false)}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {/* โพสต์ที่เปิดประมูล */}
<div className="profile-listings">
  <h3>โพสต์ที่เปิดประมูล</h3>

  <div className="auction-grid">
    {activeListings.length > 0 ? (
      activeListings.map(item => (
        <AuctionCard key={item.id} item={item} />
      ))
    ) : (
      <p>ยังไม่มีรายการ</p>
    )}
  </div>
</div>


{/* ประวัติโพสต์ที่เปิดประมูล */}
<div className="profile-history">
  <h3>ประวัติโพสต์ที่เปิดประมูล</h3>

  <div className="auction-grid">
    {historyListings.length > 0 ? (
      historyListings.map(item => (
        <AuctionCard key={item.id} item={item} />
      ))
    ) : (
      <p>ยังไม่มีประวัติ</p>
    )}
  </div>
</div>

      <FloatingChat />
    </>
  );
};

export default ProfileSeller;
