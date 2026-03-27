import { Routes, Route, Navigate } from "react-router-dom";
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

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
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
    </Routes>
  );
}