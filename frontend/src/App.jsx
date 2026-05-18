import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import TowerDetail from "./pages/TowerDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tower/:towerId" element={<TowerDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
