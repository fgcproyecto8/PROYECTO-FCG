import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";

function App() {
  return (
    <Routes>
      {/* Redirección inicial */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Home */}
      <Route path="/inicio" element={<Home />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/amigos" element={<Friends />} />

      
    </Routes>
  );
}

export default App;