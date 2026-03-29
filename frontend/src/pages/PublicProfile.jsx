import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaUser, FaThumbsUp, FaThumbsDown, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import api from "../api";
import Navbar from "../components/Navbar";
import AuctionCard from "../components/AuctionCard";
import "./CSS/PublicProfile.css";

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [myRating, setMyRating] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report state
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ report_type: "", description: "" });
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const token = sessionStorage.getItem("token");
  const myId = sessionStorage.getItem("userId");
  const myRole = sessionStorage.getItem("role");

  useEffect(() => {
    fetchProfile();
    if (token) fetchMyRating();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${userId}/public-profile`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err.message, err.response?.status, err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRating = async () => {
    try {
      const res = await api.get(`/users/${userId}/my-rating`);
      setMyRating(res.data.rating);
    } catch {}
  };

  const handleRate = async (rating) => {
    try {
      const res = await api.post(`/users/${userId}/rate`, { rating });
      setProfile(prev => ({ ...prev, likes: res.data.likes, dislikes: res.data.dislikes }));
      setMyRating(rating);
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถให้คะแนนได้");
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  };

  const submitReport = async () => {
    setReportError("");
    setReportSuccess("");
    if (!reportForm.report_type) {
      setReportError("กรุณาเลือกประเภทการร้องเรียน");
      return;
    }
    if (!reportForm.description.trim()) {
      setReportError("กรุณากรอกรายละเอียด");
      return;
    }
    try {
      await api.post("/reports", {
        report_type: reportForm.report_type,
        target_id: userId,
        description: reportForm.description
      });
      setReportSuccess("ส่งรายงานสำเร็จ");
      setTimeout(() => {
        setShowReport(false);
        setReportSuccess("");
        setReportForm({ report_type: "", description: "" });
      }, 1500);
    } catch (err) {
      setReportError(err.response?.data?.message || "ส่งรายงานไม่สำเร็จ");
    }
  };

  if (loading) return <><Navbar /><div className="public-profile-loading">กำลังโหลด...</div></>;
  if (!profile) return <><Navbar /><div className="public-profile-loading">ไม่พบผู้ใช้</div></>;

  const isSeller = profile.role === "seller";
  const isBidderProfile = profile.role === "bidder";
  const isOwnProfile = String(myId) === String(userId);

  // ประเภทการรายงานตาม role ของผู้รายงานและผู้ถูกรายงาน
  const getReportTypes = () => {
    if (myRole === "seller" && isBidderProfile) {
      // Seller รายงาน Bidder
      return [
        "ผู้ประมูลไม่ชำระเงิน",
        "ผู้ประมูลปั่นราคา",
        "พฤติกรรมไม่เหมาะสม",
        "ข้อมูลผู้ประมูลเป็นเท็จ",
        "อื่นๆ",
      ];
    }
    // Bidder รายงาน Seller (หรือกรณีอื่น)
    return [
      "ปัญหาการประมูล",
      "ผู้ขายไม่ส่งสินค้า",
      "สินค้าไม่ตรงปก",
      "พฤติกรรมไม่เหมาะสม",
      "อื่นๆ",
    ];
  };

  return (
    <>
      <Navbar />
      <div className="public-profile-header">
        <div className="avatar">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt="profile" className="avatar-img" />
          ) : (
            <FaUser />
          )}
        </div>
        <h2>{profile.display_name}</h2>
        <p className="public-profile-username">@{profile.username}</p>
        <p className="public-profile-member">สมาชิกตั้งแต่: {formatDate(profile.created_at)}</p>

        {isSeller ? (
          <div className="public-profile-stats">
            <span>โพสต์สินค้า: {profile.auction_count} รายการ</span>
            <div className="public-profile-credits">
              <span className="credit-like">
                <FaThumbsUp /> {profile.likes}
              </span>
              <span className="credit-dislike">
                <FaThumbsDown /> {profile.dislikes}
              </span>
            </div>
            {token && !isOwnProfile && (
              <div className="public-profile-rate-btns">
                <button
                  className={`rate-btn rate-like${myRating === 'like' ? ' active' : ''}`}
                  onClick={() => handleRate('like')}
                >
                  <FaThumbsUp /> ให้คะแนน
                </button>
                <button
                  className={`rate-btn rate-dislike${myRating === 'dislike' ? ' active' : ''}`}
                  onClick={() => handleRate('dislike')}
                >
                  <FaThumbsDown /> ไม่พอใจ
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="public-profile-stats">
            <span>จำนวนครั้งที่ชนะการประมูล: {profile.win_count} ครั้ง</span>
          </div>
        )}
        {token && !isOwnProfile && (
          <button className="report-profile-btn" onClick={() => setShowReport(true)}>
            <FaExclamationTriangle /> รายงานผู้ใช้
          </button>
        )}
      </div>

      <div className="public-profile-container">
        {isSeller ? (
          <>
            <h3>สินค้าของผู้ขาย</h3>
            <div className="auction-grid">
              {profile.auctions && profile.auctions.length > 0 ? (
                profile.auctions.map(item => <AuctionCard key={item.id} item={item} />)
              ) : (
                <p>ยังไม่มีรายการ</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h3>รายการที่ประมูลชนะ</h3>
            <div className="auction-grid">
              {profile.won_auctions && profile.won_auctions.length > 0 ? (
                profile.won_auctions.map(item => <AuctionCard key={item.id} item={item} />)
              ) : (
                <p>ยังไม่มีรายการที่ชนะ</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* REPORT MODAL */}
      {showReport && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>รายงานผู้ใช้</h3>
              <span className="close-btn" onClick={() => setShowReport(false)}><FaTimes /></span>
            </div>

            {reportError && <div className="error-message">{reportError}</div>}
            {reportSuccess && <div className="success-message">{reportSuccess}</div>}

            <label>ประเภทการร้องเรียน:</label>
            <select
              value={reportForm.report_type}
              onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
              className="complaint-select"
            >
              <option value="">-- เลือกประเภท --</option>
              {getReportTypes().map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <label>รายละเอียด:</label>
            <textarea
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="อธิบายปัญหาของคุณ..."
              rows={4}
              className="complaint-textarea"
            />

            <button className="save-btn" onClick={submitReport} style={{ marginTop: 10 }}>
              ส่งรายงาน
            </button>
          </div>
        </div>
      )}
    </>
  );
}
