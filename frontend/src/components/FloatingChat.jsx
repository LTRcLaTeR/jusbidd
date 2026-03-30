import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaComments, FaTimes, FaMinus, FaExpand, FaCompress, FaImage } from "react-icons/fa";
import api from "../api";
import "../pages/CSS/FloatingChat.css";

export default function FloatingChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const myId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");

  // Don't render anything if not logged in
  if (!token) return null;

  useEffect(() => {
    if (open && !activeConv) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [open, activeConv]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!activeConv) return;
    try {
      const res = await api.get(`/messages/${activeConv.auctionId}/${activeConv.otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    try {
      await api.post("/messages", {
        auction_id: activeConv.auctionId || null,
        receiver_id: Number(activeConv.otherUserId),
        content: newMessage.trim()
      });
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConv) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.post("/messages", {
          auction_id: activeConv.auctionId || null,
          receiver_id: Number(activeConv.otherUserId),
          content: "",
          image: reader.result
        });
        fetchMessages();
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panelClass = [
    "floating-chat-panel",
    minimized ? "fc-minimized" : "",
    expanded ? "fc-expanded" : ""
  ].filter(Boolean).join(" ");

  return (
    <>
      {/* Floating button */}
      {!expanded && (
        <div className="floating-chat-btn" onClick={() => setOpen(!open)}>
          {open ? <FaTimes /> : <FaComments />}
        </div>
      )}

      {/* Hidden file input for images */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      {/* Chat panel */}
      {open && (
        <div className={panelClass}>
          {!activeConv ? (
            <>
              <div className="fc-header">
                <span className="fc-header-title">ข้อความ</span>
                <div className="fc-header-actions">
                  <button className="fc-header-btn" onClick={() => setMinimized(!minimized)} title={minimized ? "ขยาย" : "ย่อ"}>
                    {minimized ? <FaExpand /> : <FaMinus />}
                  </button>
                  <button className="fc-header-btn" onClick={() => { setExpanded(!expanded); setMinimized(false); }} title={expanded ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}>
                    {expanded ? <FaCompress /> : <FaExpand />}
                  </button>
                  {expanded && (
                    <button className="fc-header-btn" onClick={() => { setOpen(false); setExpanded(false); }} title="ปิด">
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
              <div className="fc-conv-list">
                {conversations.length === 0 && (
                  <p className="fc-empty">ยังไม่มีข้อความ</p>
                )}
                {conversations.map((c, i) => (
                  <div
                    key={i}
                    className="fc-conv-item"
                    onClick={() =>
                      setActiveConv({
                        auctionId: c.auction_id || 0,
                        otherUserId: c.other_user,
                        otherUserName: c.other_user_name,
                        otherUserRoleId: c.other_user_role_id
                      })
                    }
                  >
                    <div className="fc-conv-avatar">
                      <FaUser />
                    </div>
                    <div className="fc-conv-info">
                      <p className="fc-conv-name">{c.other_user_name}</p>
                      <p className="fc-conv-auction">{c.auction_title}</p>
                      <p className="fc-conv-last">{c.last_message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="fc-header">
                {expanded ? (
                  <>
                    <div className="fc-header-avatar" onClick={() => { if (activeConv.otherUserRoleId !== 3) navigate(`/profile/${activeConv.otherUserId}`); }} style={activeConv.otherUserRoleId !== 3 ? { cursor: "pointer" } : {}}><FaUser /></div>
                    <span className="fc-header-title" onClick={() => { if (activeConv.otherUserRoleId !== 3) navigate(`/profile/${activeConv.otherUserId}`); }} style={activeConv.otherUserRoleId !== 3 ? { cursor: "pointer" } : {}}>{activeConv.otherUserName}</span>
                    <span className="fc-header-arrow" onClick={() => { setExpanded(false); setOpen(false); setActiveConv(null); setMessages([]); }}>›</span>
                  </>
                ) : (
                  <>
                    <span className="fc-back" onClick={() => { setActiveConv(null); setMessages([]); }}>←</span>
                    <span className="fc-header-title">{activeConv.otherUserName}</span>
                    <div className="fc-header-actions">
                      <button className="fc-header-btn" onClick={() => setMinimized(!minimized)} title={minimized ? "ขยาย" : "ย่อ"}>
                        {minimized ? <FaExpand /> : <FaMinus />}
                      </button>
                      <button className="fc-header-btn" onClick={() => { setExpanded(true); setMinimized(false); }} title="ขยายเต็มจอ">
                        <FaExpand />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="fc-messages">
                {messages.map((msg) => {
                  const isMine = String(msg.sender_id) === String(myId);
                  return (
                    <div key={msg.id} className={`fc-msg-row ${isMine ? "mine" : "theirs"}`}>
                      {!isMine && (
                        <div className="fc-msg-avatar"><FaUser /></div>
                      )}
                      <div className={`fc-bubble ${isMine ? "mine" : "theirs"}`}>
                        {msg.image && (
                          <img src={msg.image} alt="sent" className="fc-msg-image" />
                        )}
                        {msg.content && <span>{msg.content}</span>}
                      </div>
                      {isMine && (
                        <div className="fc-msg-avatar"><FaUser /></div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="fc-input-bar">
                {!expanded && (
                  <button className="fc-image-btn" onClick={() => imageInputRef.current?.click()} title="ส่งรูปภาพ">
                    <FaImage />
                  </button>
                )}
                <input
                  className="fc-input"
                  placeholder="ส่งข้อความ....."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {expanded ? (
                  <button className="fc-image-btn" onClick={() => imageInputRef.current?.click()} title="ส่งรูปภาพ">
                    <FaImage />
                  </button>
                ) : (
                  <button className="fc-send" onClick={sendMessage}>ส่ง</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
