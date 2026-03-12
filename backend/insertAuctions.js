const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5434,
  user: "postgres",
  password: "1234",
  database: "jusbid",
});

async function insertAuctions() {
  try {
    // Get seller role ID
    const sellerRoleRes = await pool.query("SELECT id FROM roles WHERE name=$1", ["seller"]);
    if (sellerRoleRes.rows.length === 0) {
      console.log("Seller role not found");
      return;
    }

    // Get first seller user, or create one if none exists
    let sellerId;
    const sellerUserRes = await pool.query(
      "SELECT id FROM users WHERE role_id = $1 LIMIT 1",
      [sellerRoleRes.rows[0].id]
    );

    if (sellerUserRes.rows.length === 0) {
      // Create a default seller if none exists
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("seller123", 10);
      const createSellerRes = await pool.query(
        "INSERT INTO users (display_name, username, email, password, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ["ผู้ขาย", "seller1", "seller1@merchant.th", hashedPassword, sellerRoleRes.rows[0].id]
      );
      sellerId = createSellerRes.rows[0].id;
      console.log("Created default seller user with ID:", sellerId);
    } else {
      sellerId = sellerUserRes.rows[0].id;
    }

    // Calculate dynamic times (current time - 1 hour to now, end time + 7 days)
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Sample auctions data
    const auctions = [
      {
        title: "iPhone 15 Pro Max",
        description: "สมาร์ทโฟนระดับไฮเอนด์ ล่าสุดจาก Apple",
        image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&q=80",
        starting_price: 35000,
        category: "Electronics",
        start_time: startTime,
        end_time: endTime
      },
      {
        title: "MacBook Pro M3",
        description: "แล็ปท็อปสำหรับงานโปรเฟสชั่นแนล",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
        starting_price: 55000,
        category: "Electronics",
        start_time: startTime,
        end_time: endTime
      },
      {
        title: "รองเท้าผ้าใบ Nike",
        description: "รองเท้าสปอร์ตคุณภาพสูง",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
        starting_price: 2500,
        category: "Fashion",
        start_time: startTime,
        end_time: endTime
      },
      {
        title: "นาฬิกา Rolex",
        description: "นาฬิกาแบรนด์เนมคุณภาพสูง",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80",
        starting_price: 150000,
        category: "ศิลปะ",
        start_time: startTime,
        end_time: endTime
      },
      {
        title: "กระเป๋า LV Speedy",
        description: "กระเป๋าหัวแสตมป์แท้",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
        starting_price: 25000,
        category: "Fashion",
        start_time: startTime,
        end_time: endTime
      }
    ];

    for (const auction of auctions) {
      await pool.query(
        "INSERT INTO auctions (title, description, image, starting_price, category, seller_id, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [auction.title, auction.description, auction.image, auction.starting_price, auction.category, sellerId, auction.start_time, auction.end_time]
      );
    }

    console.log("✅ Auctions inserted successfully!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

insertAuctions();