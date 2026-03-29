import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomeBidder from "./pages/HomeBidder";
import HomeSeller from "./pages/HomeSeller";
import Admin from "./pages/Admin";
import ProfileBidder from "./pages/ProfileBidder";
import ProfileSeller from "./pages/ProfileSeller";
import CreateAuction from "./pages/CreateAuction";
import Chat from "./pages/Chat";
import Landing from "./pages/Landing";
import PublicProfile from "./pages/PublicProfile";
import api from "./api";

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

function SuspendChecker() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const checkSuspend = async () => {
      try {
        const res = await api.get("/me");
        if (res.data.status === "suspended") {
          alert("บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("role");
          navigate("/login");
        }
      } catch {}
    };

    checkSuspend();
    const interval = setInterval(checkSuspend, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <>
      <SuspendChecker />
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home-bidder" element={<HomeBidder />} />
      <Route path="/home-seller" element={<HomeSeller />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/profile" element={<ProfileBidder />} />
      <Route path="/profile-seller" element={<ProfileSeller />} />
      <Route path="/create-auction" element={<PrivateRoute><CreateAuction /></PrivateRoute>} />
      <Route path="/chat/:auctionId/:otherUserId" element={<PrivateRoute><Chat /></PrivateRoute>} />
      <Route path="/profile/:userId" element={<PublicProfile />} />
    </Routes>
    </>
  );
}