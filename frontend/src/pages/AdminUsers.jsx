import { useEffect, useState } from "react";
import { FaUser, FaThumbsUp, FaThumbsDown, FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";
import api from "../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'suspend'|'activate', userId, userName }

  // View profile state
  const [viewUser, setViewUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Send message state
  const [showMessage, setShowMessage] = useState(null); // user object
  const [messageText, setMessageText] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (searchVal) => {
    try {
      const params = searchVal ? { search: searchVal } : {};
      const res = await api.get("/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    fetchUsers(search.trim());
  };

  const handleShowAll = () => {
    setSearch("");
    fetchUsers();
  };

  const handleSuspend = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/suspend`);
      fetchUsers(search.trim() || undefined);
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/activate`);
      fetchUsers(search.trim() || undefined);
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewUser = async (userId) => {
    setViewLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setViewUser(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSendMessage = async () => {
    setMessageError("");
    setMessageSuccess("");
    if (!messageText.trim()) {
      setMessageError("กรุณากรอกข้อความ");
      return;
    }
    try {
      await api.post(`/admin/users/${showMessage.id}/message`, { content: messageText });
      setMessageSuccess("ส่งข้อความสำเร็จ");
      setMessageText("");
      setTimeout(() => {
        setShowMessage(null);
        setMessageSuccess("");
      }, 1500);
    } catch (err) {
      setMessageError(err.response?.data?.message || "ส่งข้อความไม่สำเร็จ");
    }
  };

  const getRoleThai = (role) => {
    if (role === "bidder") return "Buyer";
    if (role === "seller") return "Seller";
    return role;
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2>จัดการผู้ใช้</h2>
          <p>ค้นหา / อนุมัติ / ระงับผู้ใช้</p>
        </div>
        <div className="admin-page-header-right">
          <input
            className="admin-search-input"
            placeholder="ค้นหา ID ผู้ใช้"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="admin-btn-primary" onClick={handleShowAll}>แสดงทั้งหมด</button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>บทบาท</th>
              <th>สถานะ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>U{u.id}</td>
                <td>{u.display_name}</td>
                <td>{u.email}</td>
                <td>{getRoleThai(u.role)}</td>
                <td>
                  <span className={`status-badge status-${u.status}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <button className="btn-view" onClick={() => handleViewUser(u.id)}>View</button>
                  {u.status === "suspended" ? (
                    <button className="btn-activate" onClick={() => setConfirmAction({ type: 'activate', userId: u.id, userName: u.display_name })}>
                      Activate
                    </button>
                  ) : (
                    <button className="btn-suspend" onClick={() => setConfirmAction({ type: 'suspend', userId: u.id, userName: u.display_name })}>
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#aaa" }}>ไม่พบข้อมูลผู้ใช้</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Suspend/Activate Dialog */}
      {confirmAction && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>
              {confirmAction.type === 'suspend'
                ? <><FaExclamationTriangle /> ยืนยันการระงับบัญชี</>
                : <><FaCheck /> ยืนยันการเปิดใช้งานบัญชี</>}
            </h3>
            <p>
              {confirmAction.type === 'suspend'
                ? `คุณต้องการระงับบัญชีผู้ใช้ "${confirmAction.userName}" ใช่หรือไม่?`
                : `คุณต้องการเปิดใช้งานบัญชี "${confirmAction.userName}" ใช่หรือไม่?`}
            </p>
            <div className="admin-modal-actions">
              <button
                className="admin-btn-primary"
                onClick={() => {
                  if (confirmAction.type === 'suspend') handleSuspend(confirmAction.userId);
                  else handleActivate(confirmAction.userId);
                }}
              >
                ยืนยัน
              </button>
              <button className="admin-btn-secondary" onClick={() => setConfirmAction(null)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Profile Modal */}
      {viewUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3>โปรไฟล์ผู้ใช้</h3>
              <span className="admin-modal-close" onClick={() => setViewUser(null)}><FaTimes /></span>
            </div>

            {viewLoading ? (
              <p>กำลังโหลด...</p>
            ) : (
              <>
                <div className="admin-user-profile-card">
                  <div className="admin-user-avatar"><FaUser /></div>
                  <div className="admin-user-info">
                    <h4>{viewUser.display_name}</h4>
                    <p>@{viewUser.username}</p>
                    <p>{viewUser.email}</p>
                    <p>บทบาท: {getRoleThai(viewUser.role)}</p>
                    <p>สมาชิกตั้งแต่: {formatDate(viewUser.created_at)}</p>
                    <p>สถานะ: <span className={`status-badge status-${viewUser.status}`}>{viewUser.status}</span></p>
                    {viewUser.role === 'bidder' && (
                      <p>จำนวนครั้งที่ชนะการประมูล: {viewUser.win_count} ครั้ง</p>
                    )}
                    {viewUser.role === 'seller' && (
                      <>
                        <p>จำนวนโพสต์: {viewUser.auction_count} รายการ</p>
                        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                          <span style={{ color: "#2e7d32", display: "flex", alignItems: "center", gap: 4 }}>
                            <FaThumbsUp /> {viewUser.likes}
                          </span>
                          <span style={{ color: "#c62828", display: "flex", alignItems: "center", gap: 4 }}>
                            <FaThumbsDown /> {viewUser.dislikes}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button className="admin-btn-primary" onClick={() => { setShowMessage(viewUser); setViewUser(null); }}>
                    ส่งข้อความ
                  </button>
                  <button className="admin-btn-secondary" onClick={() => setViewUser(null)}>
                    ปิด
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessage && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>ส่งข้อความถึง {showMessage.display_name}</h3>
              <span className="admin-modal-close" onClick={() => { setShowMessage(null); setMessageText(""); setMessageError(""); setMessageSuccess(""); }}><FaTimes /></span>
            </div>

            {messageSuccess && <div className="admin-success-msg">{messageSuccess}</div>}
            {messageError && <div className="admin-error-msg">{messageError}</div>}

            <textarea
              className="admin-message-textarea"
              placeholder="พิมพ์ข้อความ..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />

            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={handleSendMessage}>ส่งข้อความ</button>
              <button className="admin-btn-secondary" onClick={() => { setShowMessage(null); setMessageText(""); }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
