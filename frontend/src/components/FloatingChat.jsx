import { useEffect, useState, useRef } from "react";
import { FaUser, FaComments, FaTimes } from "react-icons/fa";
import api from "../api";
import "./CSS/FloatingChat.css";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // { auctionId, otherUserId, otherUserName }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const myId = sessionStorage.getItem("userId");

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
        auction_id: Number(activeConv.auctionId),
        receiver_id: Number(activeConv.otherUserId),
        content: newMessage.trim()
      });
      setNewMessage("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="floating-chat-btn" onClick={() => setOpen(!open)}>
        {open ? <FaTimes /> : <FaComments />}
      </div>

      {/* Chat panel */}
      {open && (
        <div className="floating-chat-panel">
          {!activeConv ? (
            <>
              <div className="fc-header">
                <span>ข้อความ</span>
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
                        auctionId: c.auction_id,
                        otherUserId: c.other_user,
                        otherUserName: c.other_user_name
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
                <span className="fc-back" onClick={() => { setActiveConv(null); setMessages([]); }}>←</span>
                <span>{activeConv.otherUserName}</span>
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
                        {msg.content}
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
                <input
                  className="fc-input"
                  placeholder="ส่งข้อความ..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="fc-send" onClick={sendMessage}>ส่ง</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
