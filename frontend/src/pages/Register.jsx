import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Register() {
  const navigate = useNavigate(); // 👈 NUEVO

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    role: "player",
    cancha: "",
    direccion: "",
    telefono: "",
  });

  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const e = {};

    if (!form.username.trim()) e.username = "Ingresá un nombre de usuario";
    if (!form.email.includes("@")) e.email = 'El email debe contener "@"';

    if (form.password.length <= 6) {
      e.password = "La contraseña debe tener más de 6 caracteres";
    }

    if (form.confirm !== form.password) {
      e.confirm = "Las contraseñas no coinciden";
    }

    // 🔴 VALIDACIÓN EXTRA PARA DUEÑO
    if (form.role === "owner") {
      if (!form.cancha.trim()) e.cancha = "Ingresá el nombre de la cancha";
      if (!form.direccion.trim()) e.direccion = "Ingresá la dirección";
      if (!form.telefono.trim()) e.telefono = "Ingresá un teléfono";
    }

    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length === 0) {
      const user = {
        ...form,
        status: form.role === "owner" ? "pending" : "approved",
      };

      // 💾 guardar usuario
      localStorage.setItem("user", JSON.stringify(user));

      // 🚀 ir a HOME
      navigate("/inicio");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      
      {/* 🌙 MODO OSCURO */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <FormContainer
          title="Registrarse"
          footer={
            <span className="text-gray-600 dark:text-gray-400">
              ¿Ya tenés cuenta?{" "}
              <Link
                to="/login"
                className="text-brand font-semibold hover:underline"
              >
                Iniciar sesión
              </Link>
            </span>
          }
        >
          <form onSubmit={onSubmit} noValidate className="space-y-4">

            {/* USUARIO */}
            <Input
              label="Nombre de usuario"
              name="username"
              placeholder="tu_usuario"
              value={form.username}
              onChange={onChange}
              error={errors.username}
            />

            {/* EMAIL */}
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={onChange}
              error={errors.email}
            />

            {/* CONTRASEÑA */}
            <Input
              label="Contraseña"
              name="password"
              isPassword
              placeholder="Más de 6 caracteres"
              value={form.password}
              onChange={onChange}
              error={errors.password}
            />

            {/* CONFIRMAR */}
            <Input
              label="Confirmar contraseña"
              name="confirm"
              isPassword
              placeholder="Repetí la contraseña"
              value={form.confirm}
              onChange={onChange}
              error={errors.confirm}
            />

            {/* ROL */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Tipo de usuario
              </label>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3"
              >
                <option value="player">Jugador</option>
                <option value="owner">Dueño de cancha</option>
              </select>
            </div>

            {/* CAMPOS DUEÑO */}
            {form.role === "owner" && (
              <>
                <Input
                  label="Nombre de la cancha"
                  name="cancha"
                  value={form.cancha}
                  onChange={onChange}
                  error={errors.cancha}
                />

                <Input
                  label="Dirección"
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                  error={errors.direccion}
                />

                <Input
                  label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={onChange}
                  error={errors.telefono}
                />

                <p className="text-xs text-yellow-500 text-center">
                  Tu cuenta será revisada antes de habilitar funciones de dueño.
                </p>
              </>
            )}

            <Button type="submit">Crear cuenta</Button>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}