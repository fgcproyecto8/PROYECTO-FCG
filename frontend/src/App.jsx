import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
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

      <Route path="/partidos" element={<Partidos />} />
      <Route path="/crear-partido" element={<Partidos />} /> {/* reemplazar por CrearPartido cuando exista */}

    </Routes>
  );
}

export default App;