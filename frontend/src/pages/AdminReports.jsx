import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";
import api from "../api";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

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
    setFilterStatus("all");
    fetchReports();
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      fetchReports(search.trim() || undefined);
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport({ ...selectedReport, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "pending") return <span className="status-badge status-pending">รอดำเนินการ</span>;
    if (status === "resolved") return <span className="status-badge status-resolved">แก้ไขแล้ว</span>;
    if (status === "rejected") return <span className="status-badge" style={{ background: "#e57373", color: "#fff" }}>ปฏิเสธ</span>;
    return <span className="status-badge">{status}</span>;
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
  };

  const filteredReports = filterStatus === "all"
    ? reports
    : reports.filter(r => r.status === filterStatus);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h2>กล่องรับแจ้งคำร้องเรียน</h2>
          <p>รับเรื่อง → ตรวจสอบ → ตัดสิน</p>
        </div>
        <div className="admin-page-header-right">
          <select
            className="admin-search-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="resolved">แก้ไขแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
          <input
            className="admin-search-input"
            placeholder="ค้นหา ID หรือประเภท"
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
                  <th>ประเภทคำร้อง</th>
                  <th>ผู้รายงาน</th>
                  <th>ผู้ถูกรายงาน</th>
                  <th>สถานะ</th>
                  <th>เวลา</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id} className={selectedReport?.id === r.id ? "selected-row" : ""}>
                    <td>R{String(r.id).padStart(3, "0")}</td>
                    <td>{r.report_type}</td>
                    <td>{r.reporter_name} (U{r.reporter_id})</td>
                    <td>{r.target_name ? `${r.target_name} (U${r.target_id})` : r.target_id}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <button className="btn-open" onClick={() => setSelectedReport(r)}>เปิด</button>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
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
          <h3>รายละเอียดคำร้องเรียน</h3>
          {selectedReport ? (
            <>
              <div className="report-detail-type"><strong>ประเภทคำร้อง:</strong> {selectedReport.report_type}</div>
              <div className="report-detail-from">
                <strong>ผู้รายงาน:</strong> {selectedReport.reporter_name} (U{selectedReport.reporter_id})
              </div>
              {selectedReport.reporter_email && (
                <div className="report-detail-from"><strong>อีเมลผู้รายงาน:</strong> {selectedReport.reporter_email}</div>
              )}
              <div className="report-detail-target"><strong>ผู้ถูกรายงาน:</strong> {selectedReport.target_name ? `${selectedReport.target_name} (@${selectedReport.target_username})` : selectedReport.target_id}</div>
              <div className="report-detail-date"><strong>เวลาที่รายงาน:</strong> {formatDate(selectedReport.created_at)}</div>
              <div style={{ marginBottom: 8 }}><strong>สถานะ:</strong> {getStatusBadge(selectedReport.status)}</div>
              <div className="report-detail-content">
                <strong>เหตุผล / รายละเอียด:</strong><br />
                {selectedReport.description || "ไม่มีรายละเอียด"}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedReport.status === "pending" && (
                  <>
                    <button className="admin-btn-primary" onClick={() => handleUpdateStatus(selectedReport.id, "resolved")}>
                      <FaCheck /> แก้ไขแล้ว
                    </button>
                    <button className="admin-btn-secondary" onClick={() => handleUpdateStatus(selectedReport.id, "rejected")} style={{ background: "#e57373", color: "#fff" }}>
                      <FaTimes /> ปฏิเสธ
                    </button>
                  </>
                )}
                {selectedReport.status !== "pending" && (
                  <button className="admin-btn-secondary" onClick={() => handleUpdateStatus(selectedReport.id, "pending")}>
                    <FaSyncAlt /> กลับไปรอดำเนินการ
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
