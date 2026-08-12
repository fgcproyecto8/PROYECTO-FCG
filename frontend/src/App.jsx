import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Canchas from "./pages/Canchas";
import CanchaForm from "./pages/CanchaForm";
import Partidos from "./pages/Partidos";

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

      {/* Partidos */}
      <Route path="/partidos" element={<Partidos />} />
      <Route path="/crear-partido" element={<Partidos />} />

      {/* Canchas */}
      <Route path="/canchas" element={<Canchas />} />
      <Route path="/canchas/nueva" element={<CanchaForm />} />
      <Route path="/canchas/:id/editar" element={<CanchaForm />} />

      {/* Perfil */}
      <Route path="/perfil" element={<Profile />} />
      <Route path="/amigos" element={<Friends />} />
    </Routes>
  );
}

export default App;