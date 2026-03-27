import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaUserCircle, FaSearch } from "react-icons/fa";
import "../pages/CSS/Navbar.css";
import logo from "../assets/logo.png";

export default function Navbar({ onSearch }) {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  const [openMenu, setOpenMenu] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleSearch = () => {
    if (onSearch) onSearch(searchText.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("role");
    navigate("/");
  };

  const handleProfileClick = () => {
    if (role === "seller") {
      navigate("/profile-seller");
    } else {
      navigate("/profile");
    }
  };

  const handleHomeClick = () => {
    if (!role) {
      navigate("/");
    } else if (role === "seller") {
      navigate("/home-seller");
    } else if (role === "bidder") {
      navigate("/home-bidder");
    } else if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="navbar">

      {/* LEFT LOGO */}
      <div className="nav-left"> 
        <img src={logo} alt="logo" className="nav-logo" />
      </div>

      {/* HOME BUTTON */}
      <button className="btn-home" onClick={handleHomeClick} style={{marginLeft: 16}}>
        หน้าแรก
      </button>

      {/* CENTER SEARCH */}
      <div className="nav-center">
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <button className="nav-search-btn" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      {/* RIGHT BUTTONS */}
      <div className="nav-right">

        {!token ? (
          <>
            <button
              className="btn-outline"
              onClick={() => navigate("/login")}
            >
              ลงชื่อเข้าใช้
            </button>

            <button
              className="btn-fill"
              onClick={() => navigate("/register")}
            >
              สมัครสมาชิก
            </button>
          </>
        ) : (
          <div className="profile-wrapper">

            {/* PROFILE ICON */}
            <div
              className="profile-icon"
              onClick={() => setOpenMenu(!openMenu)}
            >
              <FaUserCircle />
            </div>

            {/* DROPDOWN */}
            {openMenu && (
              <div className="profile-menu">
                <div onClick={handleProfileClick}>
                  โปรไฟล์
                </div>

                <div onClick={handleLogout}>
                  ออกจากระบบ
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}