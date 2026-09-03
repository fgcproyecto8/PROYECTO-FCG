import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

import { registerUser } from "../services/api.js";
import { mapBackendRole, mapEstadoDueno } from "../utils/roles.js";
import { mapearErroresDeCampos } from "../utils/apiErrors.js";


export default function Register() {
  const navigate = useNavigate();

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
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);


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

    if (!form.username.trim()) {
      e.username = "Ingresá un nombre de usuario";
    }

    if (!form.email.includes("@")) {
      e.email = 'El email debe contener "@"';
    }

    if (form.password.length < 8) {
      e.password = "La contraseña debe tener al menos 8 caracteres y al menos una letra";
    }

    if (form.confirm !== form.password) {
      e.confirm = "Las contraseñas no coinciden";
    }

    if (form.role === "owner") {
      if (!form.cancha.trim()) {
        e.cancha = "Ingresá el nombre de la cancha";
      }

      if (!form.direccion.trim()) {
        e.direccion = "Ingresá la dirección";
      }

      if (!form.telefono.trim()) {
        e.telefono = "Ingresá un teléfono";
      }
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

    const datos = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirm_password: form.confirm,

      tipo_usuario:
        form.role === "owner"
          ? "dueno_cancha"
          : "jugador",
    };

    if (form.role === "owner") {
      datos.nombre_cancha = form.cancha.trim();
      datos.direccion = form.direccion.trim();
      datos.telefono = form.telefono.trim();
    }

    try {
      setLoading(true);

      const data = await registerUser(datos);

      const backendRole = data.usuario.rol;
      const frontendRole = mapBackendRole(backendRole);

      const backendStatus = data.solicitud_dueno?.estado;
      const frontendStatus = mapEstadoDueno(backendRole, backendStatus);

      const user = {
        ...data.usuario,
        role: frontendRole,
        backendRole: backendRole,
        status: frontendStatus,
        solicitudDueno:
          data.solicitud_dueno || null,
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
        username: "username",
        email: "email",
        password: "password",
        confirm_password: "confirm",
        nombre_cancha: "cancha",
        direccion: "direccion",
        telefono: "telefono",
      });

      setErrors(nuevosErrores);

      if (
        Object.keys(nuevosErrores).length === 0
      ) {
        setGeneralError(
          error.message ||
            "No se pudo completar el registro."
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
          <form
            onSubmit={onSubmit}
            noValidate
            className="space-y-4"
          >

            <Input
              label="Nombre de usuario"
              name="username"
              placeholder="tu_usuario"
              value={form.username}
              onChange={onChange}
              error={errors.username}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={onChange}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              name="password"
              isPassword
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={onChange}
              error={errors.password}
            />

            <Input
              label="Confirmar contraseña"
              name="confirm"
              isPassword
              placeholder="Repetí la contraseña"
              value={form.confirm}
              onChange={onChange}
              error={errors.confirm}
            />

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
                <option value="player">
                  Jugador
                </option>

                <option value="owner">
                  Dueño de cancha
                </option>
              </select>
            </div>

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
                  Tu cuenta será revisada antes de habilitar
                  funciones de dueño.
                </p>
              </>
            )}

            {generalError && (
              <p className="text-sm text-red-500 text-center">
                {generalError}
              </p>
            )}

            <Button type="submit">
              {loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </Button>

          </form>
        </FormContainer>
      </div>
    </div>
  );
}