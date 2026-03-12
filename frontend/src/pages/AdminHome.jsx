import { useEffect, useState } from "react";
import api from "../api";

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAuctions: 0,
    pendingReports: 0,
    resolvedReports: 0,
    recentActivities: [],
  });
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAuctions();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuctions = async () => {
    try {
      const res = await api.get("/admin/auctions");
      setAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusText = (a) => {
    const now = new Date();
    const end = new Date(a.end_time);
    if (now >= end) return "ปิดแล้ว";
    if (a.status === "active") return "ราคาปัจจุบัน";
    return a.status;
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
  };

  return (
    <>
      {/* Stats Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div>
            <div className="stat-label">ผู้ใช้ทั้งหมด</div>
            <div className="stat-sublabel">Active / Suspended</div>
          </div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="admin-stat-card">
          <div>
            <div className="stat-label">รายการที่กำลังประมูล</div>
            <div className="stat-sublabel">ประมูลที่กำลังดำเนินการ</div>
          </div>
          <div className="stat-value">{stats.activeAuctions}</div>
        </div>
        <div className="admin-stat-card">
          <div>
            <div className="stat-label">คำร้องเรียน</div>
            <div className="stat-sublabel">ต้องตรวจสอบ / แก้ไข</div>
          </div>
          <div className="stat-value">{stats.pendingReports + stats.resolvedReports}</div>
        </div>
        <div className="admin-stat-card">
          <div>
            <div className="stat-label">กิจกรรมล่าสุด</div>
          </div>
          <div className="stat-value">{stats.recentActivities.length}</div>
        </div>
      </div>

      {/* Body: Auction Preview + Recent */}
      <div className="admin-dashboard-body">
        {/* Auction Live Preview */}
        <div className="admin-auction-preview">
          <h3>Auction Live Preview</h3>
          {auctions.slice(0, 8).map((a) => (
            <div className="auction-preview-item" key={a.id}>
              <div className="auction-preview-left">
                <div className="auction-preview-title">{a.title}</div>
                <div className="auction-preview-detail">
                  ID: A{a.id} | ราคาเริ่มต้น: {a.starting_price} | สถานะ: {a.status === "active" ? "สินสุดการประมูล" : a.status}
                </div>
              </div>
              <div className="auction-preview-right">
                <div className="auction-preview-price">{a.current_bid || a.starting_price} $</div>
                <div className="auction-preview-status">{getStatusText(a)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities Panel */}
        <div className="admin-recent-panel">
          <h3>Recent</h3>
          {stats.recentActivities.map((act, i) => (
            <div className="recent-item" key={i}>
              <div>
                <div className="recent-info">U{act.user_id} → A{act.auction_id}</div>
                <div className="recent-sub">{formatDate(act.bid_time)} | {act.activity_type}</div>
              </div>
              <div>
                <div className="recent-amount">{act.bid_amount} $</div>
              </div>
            </div>
          ))}
          {stats.recentActivities.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>ไม่มีกิจกรรม</div>
          )}
        </div>
      </div>
    </>
  );
}
