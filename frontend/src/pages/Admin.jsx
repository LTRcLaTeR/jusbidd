import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaEnvelope, FaClipboardList, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import AdminHome from "./AdminHome";
import AdminUsers from "./AdminUsers";
import AdminReports from "./AdminReports";
import AdminAuctionLogs from "./AdminAuctionLogs";
import logo from "../assets/logo.png";
import "./CSS/Admin.css";

const TABS = [
  { key: "home", label: "หน้าแรก", icon: <FaHome /> },
  { key: "users", label: "ข้อมูลผู้เข้าใช้งานระบบ", icon: <FaUsers /> },
  { key: "reports", label: "กล่องรับแจ้งคำร้องเรียน", icon: <FaEnvelope /> },
  { key: "logs", label: "บันทึกการประมูล", icon: <FaClipboardList /> },
];

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("role");
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <AdminHome />;
      case "users": return <AdminUsers />;
      case "reports": return <AdminReports />;
      case "logs": return <AdminAuctionLogs />;
      default: return <AdminHome />;
    }
  };

  return (
    <div className="admin-layout">
      {/* FIXED HEADER */}
      <header className="admin-header">
        <div className="admin-header-left">
          <img src={logo} alt="logo" className="admin-header-logo" />
          <h1 className="admin-header-title">Admin Dashboard</h1>
        </div>
        <div className="admin-header-right">
          <FaUserCircle className="admin-profile-icon" />
        </div>
      </header>

      {/* BODY */}
      <div className="admin-body">
        {/* FIXED SIDEBAR */}
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`admin-sidebar-item ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="sidebar-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          <button className="admin-sidebar-logout" onClick={handleLogout}>
            <FaSignOutAlt className="sidebar-icon" />
            ออกจากระบบ
          </button>
        </aside>

        {/* SCROLLABLE CONTENT */}
        <main className="admin-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
