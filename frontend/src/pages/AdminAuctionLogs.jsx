import { useEffect, useState } from "react";
import api from "../api";

export default function AdminAuctionLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (searchVal) => {
    try {
      const params = searchVal ? { search: searchVal } : {};
      const res = await api.get("/admin/auction-logs", { params });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    let val = search.trim();
    if (/^[Uu]\d+$/.test(val)) {
      val = val.substring(1);
    }
    fetchLogs(val);
  };

  const handleShowAll = () => {
    setSearch("");
    fetchLogs();
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2>บันทึกการประมูล</h2>
          <p>ตรวจสอบ bid / เวลา / user</p>
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
              <th>Log ID</th>
              <th>Auction</th>
              <th>User</th>
              <th>Bid</th>
              <th>เวลา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>L{log.id}</td>
                <td>A{log.auction_id}</td>
                <td>U{log.user_id}</td>
                <td>{log.bid_amount}บาท</td>
                <td>{formatDate(log.bid_time)}</td>
                <td>{log.log_status}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#aaa" }}>ไม่มีบันทึก</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
