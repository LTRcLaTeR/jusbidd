import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaImage } from "react-icons/fa";
import api from "../api";
import "./CSS/Chat.css";

export default function Chat() {
  const { auctionId, otherUserId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState({});
  const [auction, setAuction] = useState({});
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const myId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetchOtherUser();
    fetchAuction();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [auctionId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchOtherUser = async () => {
    try {
      const res = await api.get(`/users/${otherUserId}`);
      setOtherUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const isOtherAdmin = otherUser.role_id === 3;

  const handleProfileClick = () => {
    if (!isOtherAdmin) {
      navigate(`/profile/${otherUserId}`);
    }
  };

  const fetchAuction = async () => {
    if (auctionId === '0' || auctionId === 'null') return;
    try {
      const res = await api.get(`/auctions/${auctionId}`);
      setAuction(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${auctionId}/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post("/messages", {
        auction_id: (auctionId === '0' || auctionId === 'null') ? 0 : Number(auctionId),
        receiver_id: Number(otherUserId),
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

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.post("/messages", {
          auction_id: (auctionId === '0' || auctionId === 'null') ? 0 : Number(auctionId),
          receiver_id: Number(otherUserId),
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

  return (
    <div className="chat-page">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar" onClick={handleProfileClick} style={!isOtherAdmin ? { cursor: "pointer" } : {}}>
            <FaUser />
          </div>
          <span className="chat-other-name" onClick={handleProfileClick} style={!isOtherAdmin ? { cursor: "pointer" } : {}}>
            {otherUser.display_name || "..."}
          </span>
          <span className="chat-back" onClick={() => navigate(-1)}>›</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => {
          const isMine = String(msg.sender_id) === String(myId);
          return (
            <div key={msg.id} className={`chat-msg-row ${isMine ? "mine" : "theirs"}`}>
              {!isMine && (
                <div className="chat-msg-avatar">
                  <FaUser />
                </div>
              )}
              <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
                {msg.image && (
                  <img src={msg.image} alt="sent" className="chat-msg-image" />
                )}
                {msg.content && <span>{msg.content}</span>}
              </div>
              {isMine && (
                <div className="chat-msg-avatar">
                  <FaUser />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          placeholder="ส่งข้อความ....."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="chat-input-icons">
          <FaImage className="chat-icon" onClick={() => imageInputRef.current?.click()} />
        </div>
      </div>
    </div>
  );
}
