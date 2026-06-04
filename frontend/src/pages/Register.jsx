import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Ingresá un nombre de usuario";
    if (!form.email.includes("@")) e.email = 'El email debe contener "@"';
    if (form.password.length <= 6)
      e.password = "La contraseña debe tener más de 6 caracteres";
    if (form.confirm !== form.password)
      e.confirm = "Las contraseñas no coinciden";
    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <FormContainer
      title="Registrarse"
      footer={
        <span className="text-gray-600 dark:text-gray-400">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-brand font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Nombre de usuario"
          name="username"
          placeholder="tu_usuario"
          value={form.username}
          onChange={onChange}
          error={errors.username}
          autoComplete="username"
        />
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
          placeholder="Más de 6 caracteres"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          label="Confirmar contraseña"
          name="confirm"
          isPassword
          placeholder="Repetí la contraseña"
          value={form.confirm}
          onChange={onChange}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit">Crear cuenta</Button>
        {submitted && (
          <p className="text-sm text-center text-brand">¡Cuenta creada! (demo, sin backend)</p>
        )}
      </form>
    </FormContainer>
  );
}
