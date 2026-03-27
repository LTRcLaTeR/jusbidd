import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import AuctionCard from "../components/AuctionCard";
import FloatingChat from "../components/FloatingChat";
import "./CSS/Home.css";

const CATEGORIES = [
  "ของสะสม", "อิเล็กทรอนิกส์", "แฟชั่น", "ศิลปะ", "ยานพาหนะ",
  "เครื่องประดับ", "นาฬิกา", "กีฬา", "เครื่องใช้ไฟฟ้า", "หนังสือ",
  "เฟอร์นิเจอร์", "เครื่องดนตรี", "ของเล่น", "สุขภาพและความงาม", "อื่นๆ"
];

export default function HomeSeller() {
  const [myAuctions, setMyAuctions] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all" or "mine"
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyAuctions();
    fetchAllAuctions();
  }, [selectedCategory, searchQuery]);

  const fetchMyAuctions = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      const res = await api.get("/auctions/my-listings", { params });
      setMyAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllAuctions = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      const res = await api.get("/auctions", { params });
      setAllAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(prev => prev === cat ? "" : cat);
  };

  const displayAuctions = viewMode === "mine" ? myAuctions : allAuctions;

  return (
    <>
      <Navbar onSearch={setSearchQuery} />

      <div className="home-container">

        <h1 className="home-title">Jus(tice) Bid</h1>

        {/* View mode toggle */}
        <div className="seller-view-toggle">
          <button
            className={`view-toggle-btn${viewMode === "all" ? " active" : ""}`}
            onClick={() => setViewMode("all")}
          >
            สินค้าทั้งหมด
          </button>
          <button
            className={`view-toggle-btn${viewMode === "mine" ? " active" : ""}`}
            onClick={() => setViewMode("mine")}
          >
            สินค้าของฉัน
          </button>
        </div>

        <div className="category-section">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category${selectedCategory === cat ? " active" : ""}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <h2 className="auction-header">
          {viewMode === "mine" ? "รายการประมูลของฉัน" : "รายการประมูลทั้งหมด"}
        </h2>

        <div className="auction-grid">
          {displayAuctions
            .filter((item) => {
              const now = new Date();
              const start = new Date(item.start_time);
              return now >= start;
            })
            .map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))}
        </div>

      </div>

      {/* ปุ่มเพิ่มรายการ */}
      <button
        className="add-auction-btn"
        onClick={() => navigate("/create-auction")}
      >
        +
      </button>

      <FloatingChat />
    </>
  );
}