import { useEffect, useState } from "react";
import api from "../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/activate`);
      fetchUsers(search.trim() || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleThai = (role) => {
    if (role === "bidder") return "Buyer";
    if (role === "seller") return "Seller";
    return role;
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
                  <button className="btn-view">View</button>
                  {u.status === "suspended" ? (
                    <button className="btn-activate" onClick={() => handleActivate(u.id)}>Activate</button>
                  ) : (
                    <button className="btn-suspend" onClick={() => handleSuspend(u.id)}>Suspend</button>
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
    </>
  );
}
