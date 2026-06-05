import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // 👈 NUEVO

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = 'El email debe contener "@"';
    if (form.password.length === 0) e.password = "Ingresá tu contraseña";
    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length === 0) {
      // 💾 guardar usuario (simulación)
      localStorage.setItem(
        "user",
        JSON.stringify({ email: form.email })
      );

      // 🚀 redirigir a home
      navigate("/inicio");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      
      {/* 🌙 BOTÓN MODO OSCURO */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <FormContainer
          title="Iniciar sesión"
          footer={
            <span className="text-gray-600 dark:text-gray-400">
              ¿No tenés cuenta?{" "}
              <Link
                to="/register"
                className="text-brand font-semibold hover:underline"
              >
                Registrate
              </Link>
            </span>
          }
        >
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={onChange}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              name="password"
              isPassword
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit">Iniciar sesión</Button>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}