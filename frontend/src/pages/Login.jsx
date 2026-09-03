import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

import { loginUser } from "../services/api.js";
import { mapBackendRole, mapEstadoDueno } from "../utils/roles.js";
import { mapearErroresDeCampos } from "../utils/apiErrors.js";


export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: undefined,
    });

    setGeneralError("");
  };


  const validate = () => {
    const e = {};

    if (!form.email.includes("@")) {
      e.email = 'El email debe contener "@"';
    }

    if (form.password.length === 0) {
      e.password = "Ingresá tu contraseña";
    }

    return e;
  };


  const onSubmit = async (ev) => {
    ev.preventDefault();

    const validationErrors = validate();

    setErrors(validationErrors);
    setGeneralError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      const backendRole = data.usuario.rol;
      const frontendRole = mapBackendRole(backendRole);

      const backendStatus = data.solicitud_dueno?.estado;
      const frontendStatus = mapEstadoDueno(backendRole, backendStatus);

      const user = {
        ...data.usuario,
        role: frontendRole,
        backendRole: backendRole,
        status: frontendStatus,
        solicitudDueno: data.solicitud_dueno || null,
      };

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      navigate("/inicio");

    } catch (error) {
      const backendErrors = error.data || {};

      const nuevosErrores = mapearErroresDeCampos(backendErrors, {
        email: "email",
        password: "password",
      });

      setErrors(nuevosErrores);

      if (Object.keys(nuevosErrores).length === 0) {
        setGeneralError(
          error.message ||
            "No se pudo iniciar sesión."
        );
      }

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">

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
          <form
            onSubmit={onSubmit}
            noValidate
            className="space-y-4"
          >
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

            {generalError && (
              <p className="text-sm text-red-500 text-center">
                {generalError}
              </p>
            )}

            <Button type="submit">
              {loading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </Button>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}