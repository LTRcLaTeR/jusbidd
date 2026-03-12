import { useEffect, useState } from "react";
import api from "../api";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (searchVal) => {
    try {
      const params = searchVal ? { search: searchVal } : {};
      const res = await api.get("/admin/reports", { params });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    fetchReports(search.trim());
  };

  const handleShowAll = () => {
    setSearch("");
    fetchReports();
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      fetchReports(search.trim() || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "pending") return <span className="status-badge status-pending">รอ</span>;
    if (status === "resolved") return <span className="status-badge status-resolved">แก้ไขแล้ว</span>;
    return <span className="status-badge">{status}</span>;
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
          <h2>คำร้องเรียน และ ข้อพิพาท</h2>
          <p>รับเรื่อง → ตรวจสอบ→ ตัดสิน</p>
        </div>
        <div className="admin-page-header-right">
          <input
            className="admin-search-input"
            placeholder="ค้นหา ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="admin-btn-primary" onClick={handleShowAll}>แสดงทั้งหมด</button>
        </div>
      </div>

      <div className="admin-reports-body">
        <div className="admin-reports-table-section">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>ประเภท</th>
                  <th>คำร้องจาก</th>
                  <th>เป้าหมาย</th>
                  <th>สถานะ</th>
                  <th>เวลา</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>R{String(r.id).padStart(3, "0")}</td>
                    <td>{r.report_type}</td>
                    <td>U{r.reporter_id}</td>
                    <td>{r.target_id}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <button className="btn-open" onClick={() => setSelectedReport(r)}>เปิด</button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#aaa" }}>ไม่มีคำร้องเรียน</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="admin-report-detail-panel">
          <h3>คำร้องเรียน</h3>
          {selectedReport ? (
            <>
              <div className="report-detail-from">จาก U{selectedReport.reporter_id}</div>
              <div className="report-detail-content">
                {selectedReport.description || "ไม่มีรายละเอียด"}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                {selectedReport.status === "pending" && (
                  <button className="admin-btn-primary" onClick={() => handleUpdateStatus(selectedReport.id, "resolved")}>
                    แก้ไขแล้ว
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-report-selected">เลือกรายงานเพื่อดูรายละเอียด</div>
          )}
        </div>
      </div>
    </>
  );
}
