import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Canchas from "./pages/Canchas";
import CanchaForm from "./pages/CanchaForm";
import Partidos from "./pages/Partidos";


function App() {
  return (
    <Routes>
      <Route path="/canchas/nueva" element={<CanchaForm />} />
      <Route path="/canchas/:id/editar" element={<CanchaForm />} />
      
      <Route path="/canchas" element={<Canchas />} />

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