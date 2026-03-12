import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import AuctionCard from "../components/AuctionCard";
import "./CSS/Home.css";

export default function HomeBidder() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await api.get("/auctions");
      setAuctions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />

      <div className="home-container">
        {/* ชื่อกลางหน้า */}
        <h1 className="home-title">Jus(tice) Bid</h1>

        {/* หมวดหมู่ */}
        <div className="category-section">
          <button className="category active">ของสะสม</button>
          <button className="category">อิเล็กทรอนิกส์</button>
          <button className="category">แฟชั่น</button>
          <button className="category">ศิลปะ</button>
          <button className="category">ยานพาหนะ</button>
        </div>

        {/* รายการประมูล */}
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
    </>
  );
}