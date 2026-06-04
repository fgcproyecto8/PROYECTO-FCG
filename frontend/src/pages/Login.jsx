import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
    }
  };

  return (
    <FormContainer
      title="Iniciar sesión"
      footer={
        <span className="text-gray-600 dark:text-gray-400">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="text-brand font-semibold hover:underline">
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
        {submitted && (
          <p className="text-sm text-center text-brand">¡Listo! (demo, sin backend)</p>
        )}
      </form>
    </FormContainer>
  );
}
