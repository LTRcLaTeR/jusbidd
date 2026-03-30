import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaComments, FaUser, FaPen, FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";
import api from "../api";
import "../pages/CSS/AuctionCard.css";

export default function AuctionCard({ item }) {
  const navigate = useNavigate();
  const startingPrice = Number(item.starting_price) || 0;
  const bidIncrement = Number(item.bid_increment) || 100;
  const [countdown, setCountdown] = useState("");
  const [status, setStatus] = useState("");
  const [showBidPopup, setShowBidPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [editDesc, setEditDesc] = useState(item.description || "");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [currentBid, setCurrentBid] = useState(
    Number(item.current_bid) > 0 ? Number(item.current_bid) : startingPrice
  );
  const [hasBids, setHasBids] = useState(item.has_bids === true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [winnerName, setWinnerName] = useState("");
  const [winnerId, setWinnerId] = useState(null);
  const [endTime, setEndTime] = useState(item.end_time);
  const minimumBid = hasBids ? Number(currentBid) + bidIncrement : startingPrice;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(item.start_time);
      const end = new Date(endTime);
      if (now < start) {
        setStatus("before");
        setCountdown("");
      } else if (now >= start && now < end) {
        setStatus("during");
        const diff = end - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
        } else {
          setCountdown("");
        }
      } else {
        setStatus("after");
        setCountdown("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [item.start_time, endTime]);

  // Real-time bid update + winner fetch
  useEffect(() => {
    if (status === "during") {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/auctions/${item.id}`);
          const rawBid = Number(res.data.current_bid);
          setHasBids(res.data.has_bids === true);
          setCurrentBid(
            rawBid > 0
              ? rawBid
              : Number(res.data.starting_price)
          );
          if (res.data.end_time) setEndTime(res.data.end_time);
        } catch {}
      }, 2000);
      return () => clearInterval(interval);
    }
    if (status === "after") {
      (async () => {
        try {
          const res = await api.get(`/auctions/${item.id}`);
          if (res.data.winner_name) {
            setWinnerName(res.data.winner_name);
            setWinnerId(res.data.winner_id);
          }
          const rawBid = Number(res.data.current_bid);
          setHasBids(res.data.has_bids === true);
          setCurrentBid(
            rawBid > 0
              ? rawBid
              : Number(res.data.starting_price)
          );
          if (res.data.end_time) setEndTime(res.data.end_time);
        } catch {}
      })();
    }
  }, [status, item.id, startingPrice]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const role = sessionStorage.getItem("role");
  const userId = sessionStorage.getItem("userId");

  const handleBid = async () => {
    setBidError("");
    const parsedAmount = Number.parseInt(bidAmount, 10);

    if (!bidAmount || !Number.isInteger(parsedAmount)) {
      setBidError("กรุณากรอกจำนวนเงินเป็นจำนวนเต็มเท่านั้น");
      return;
    }

    if (String(parsedAmount) !== String(bidAmount).trim()) {
      setBidError("ระบบไม่รองรับการบิทแบบทศนิยม");
      return;
    }

    if (parsedAmount < minimumBid) {
      setBidError(`ราคาขั้นต่ำที่บิทได้คือ ${minimumBid} บาท`);
      return;
    }

    try {
      const res = await api.post(`/auctions/${item.id}/bid`, { amount: parsedAmount });
      setCurrentBid(res.data.current_bid);
      setHasBids(true);
      if (res.data.end_time) setEndTime(res.data.end_time);
      setBidError("");
      setBidAmount("");
      setShowBidPopup(false);
    } catch (err) {
      const msg = err.response?.data?.message || "บิทไม่สำเร็จ";
      setBidError(msg);
    }
  };

  const handleChatSeller = () => {
    navigate(`/chat/${item.id}/${item.seller_id}`);
  };

  const handleViewSellerProfile = () => {
    navigate(`/profile/${item.seller_id}`);
  };

  const handleChatWinner = () => {
    if (winnerId) {
      navigate(`/chat/${item.id}/${winnerId}`);
    }
  };

  const handleEditAuction = async () => {
    setEditError("");
    setEditSuccess("");
    if (!editTitle.trim()) {
      setEditError("กรุณากรอกชื่อสินค้า");
      return;
    }
    try {
      await api.put(`/auctions/${item.id}`, {
        title: editTitle.trim(),
        description: editDesc.trim()
      });
      setEditSuccess("แก้ไขสำเร็จ");
      item.title = editTitle.trim();
      item.description = editDesc.trim();
      setTimeout(() => {
        setShowEditPopup(false);
        setEditSuccess("");
      }, 1200);
    } catch (err) {
      setEditError(err.response?.data?.message || "แก้ไขไม่สำเร็จ");
    }
  };

  const isSeller = role === "seller" && String(item.seller_id) === String(userId);
  const isBidder = role === "bidder";
  const isWinner = winnerId && String(winnerId) === String(userId);

  return (
    <div className="card">
      <img src={item.image} alt={item.title} />

      <div className="card-content">
        <div className="card-left">
          <h3>{item.title}</h3>
          <p className="price">ราคาเปิด {startingPrice} บาท</p>
          <p className="current-price">ราคาปัจจุบัน {currentBid} บาท</p>
          <p className="minimum-bid">บิดครั้งละ {bidIncrement} บาท</p>
          {item.auto_extend && status === "during" && (
            <p className="auto-extend-badge">⏱ ต่อเวลาอัตโนมัติ</p>
          )}
          {role === "bidder" && status === "during" && (
            <button className="bid-btn" onClick={() => setShowBidPopup(true)}>เริ่มประมูล</button>
          )}
          {status === "after" && winnerName && (
            <>
              <p className="winner-text">ผู้ชนะ: {winnerName}</p>
              <p className="winner-price-text">ราคาสุดท้าย: {currentBid.toLocaleString()} บาท</p>
              <div className="post-auction-info">
                <p className="post-auction-title">ขั้นตอนถัดไป:</p>
                <ol className="post-auction-steps">
                  <li>ติดต่อผู้ขายผ่านแชทเพื่อนัดหมาย</li>
                  <li>ตกลงวิธีการชำระเงินกับผู้ขาย</li>
                  <li>ยืนยันการรับสินค้าและตรวจสอบ</li>
                </ol>
              </div>
            </>
          )}
          {/* Bidder winner: chat with seller */}
          {status === "after" && isBidder && isWinner && (
            <button className="chat-btn-card" onClick={handleChatSeller}><FaComments /> แชทกับผู้ขาย</button>
          )}
          {/* View seller profile */}
          {item.seller_id && (
            <button className="seller-profile-btn" onClick={handleViewSellerProfile}>
              <FaUser /> ดูโปรไฟล์ผู้ขาย
            </button>
          )}
          {/* Seller: chat with winner */}
          {status === "after" && isSeller && winnerId && (
            <button className="chat-btn-card" onClick={handleChatWinner}><FaComments /> แชทกับผู้ชนะ</button>
          )}
          {/* Seller: edit before auction starts */}
          {status === "before" && isSeller && (
            <button className="edit-auction-btn" onClick={() => setShowEditPopup(true)}><FaPen /> แก้ไขรายการ</button>
          )}
        </div>
        <div className="card-right">
          <div className="start-time">
            {status === "before" && (
              <>
                <p className="label">เวลาเปิดประมูล</p>
                <p className="time">{formatDate(item.start_time)}</p>
              </>
            )}
            {status === "during" && (
              <>
                <p className="label">เวลาถอยหลังปิดประมูล</p>
                <p className="time">{countdown}</p>
              </>
            )}
            {status === "after" && (
              <>
                <p className="label">สถานะ</p>
                <p className="time">ปิดประมูลแล้ว</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bid Popup - redesigned */}
      {showBidPopup && (
        <div className="bid-popup-overlay" onClick={() => setShowBidPopup(false)}>
          <div className="bid-popup-modal-new" onClick={e => e.stopPropagation()}>
            <span className="bid-popup-close" onClick={() => setShowBidPopup(false)}>&times;</span>

            <h3 className="bid-popup-title">{item.title}</h3>

            <div className="bid-popup-layout">
              {/* Left: image */}
              <div className="bid-popup-left">
                <img src={item.image} alt={item.title} className="bid-popup-img-new" />
                <div className="bid-popup-seller-row" onClick={handleViewSellerProfile} style={{ cursor: "pointer" }}>
                  <FaUser /> <span>ผู้ขาย: {item.seller_username || "-"}</span>
                </div>
              </div>

              {/* Center: description */}
              <div className="bid-popup-center">
                <p className="bid-popup-desc-label">คำอธิบายสินค้า:</p>
                <p className="bid-popup-desc">{item.description || "ไม่มีรายละเอียด"}</p>
              </div>

              {/* Right: price + bid */}
              <div className="bid-popup-right">
                <div className="bid-popup-price-box">
                  <p className="bid-popup-current-price">ราคาปัจจุบัน: {currentBid.toLocaleString()} บาท</p>
                  <div className="bid-popup-timer-row">
                    <span className="bid-popup-timer-label">เวลาที่เหลือ</span>
                    <span className="bid-popup-timer-value">{countdown}</span>
                  </div>
                  <p className="bid-popup-condition">เงื่อนไข: เพิ่มขั้นต่ำครั้งละ {bidIncrement} บาท ถ้าต้องการบิดครั้งล่าสุด ราคาที่บิดได้ขั้นต่ำ {minimumBid.toLocaleString()} บาท</p>
                </div>

                <p className="bid-popup-increment-info">*ใส่จำนวนเงินที่ต้องการบิด</p>
                <input
                  type="number"
                  className="bid-popup-input-new"
                  step="1"
                  min={minimumBid}
                  inputMode="numeric"
                  placeholder={`ราคาขั้นต่ำ : ${minimumBid.toLocaleString()} บาท`}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value.replace(/[^0-9]/g, ""))}
                />
                {bidError && <p className="bid-popup-error">{bidError}</p>}
                <button className="bid-popup-confirm-new" onClick={handleBid}>Bid</button>
              </div>
            </div>

            {/* Bottom: chat button */}
            <div className="bid-popup-bottom">
              <button className="bid-popup-chat-btn" onClick={handleChatSeller}>
                แชทสอบถาม <FaComments />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Auction Popup */}
      {showEditPopup && (
        <div className="bid-popup-overlay" onClick={() => setShowEditPopup(false)}>
          <div className="edit-auction-modal" onClick={e => e.stopPropagation()}>
            <span className="bid-popup-close" onClick={() => setShowEditPopup(false)}>&times;</span>
            <h3>แก้ไขรายการประมูล</h3>
            <label>ชื่อสินค้า</label>
            <input
              className="edit-auction-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
            />
            <label>รายละเอียด</label>
            <textarea
              className="edit-auction-textarea"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={5}
            />
            {editError && <p className="bid-popup-error">{editError}</p>}
            {editSuccess && <p className="edit-auction-success">{editSuccess}</p>}
            <button className="bid-popup-confirm-new" onClick={handleEditAuction}>บันทึก</button>
          </div>
        </div>
      )}
    </div>
  );
}