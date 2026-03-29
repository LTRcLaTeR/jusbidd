import { useEffect, useState } from "react";
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

export default function HomeBidder() {
  const [auctions, setAuctions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAuctions();
  }, [selectedCategory, searchQuery]);

  const fetchAuctions = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      const res = await api.get("/auctions", { params });
      setAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(prev => prev === cat ? "" : cat);
  };

  return (
    <>
      <Navbar onSearch={setSearchQuery} />

      <div className="home-container">
        <h1 className="home-title">Jus(tice) Bid</h1>

        <div className="category-section">
          <button
            className={`category${selectedCategory === "" ? " active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            ทั้งหมด
          </button>
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

        <h2 className="auction-header">รายการประมูล</h2>

        <div className="auction-grid">
          {auctions
            .filter(item => {
              const now = new Date();
              const start = new Date(item.start_time);
              return now >= start;
            })
            .map(item => (
              <AuctionCard key={item.id} item={item} />
            ))}
        </div>
      </div>

      <FloatingChat />
    </>
  );
}