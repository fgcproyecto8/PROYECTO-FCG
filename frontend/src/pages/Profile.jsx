import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Settings,
  Star,
  User,
  Users,
  ChevronRight,
} from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import Card from "../components/Card";
import InfoRow from "../components/InfoRow";
import OptionPill from "../components/OptionPill";
import Avatar from "../components/Avatar";

import {
  getMe,
  updateMe,
  logoutUser,
} from "../services/api.js";

const POSITIONS = [
  "Delantero",
  "Mediocampista",
  "Defensor",
  "Portero",
];

const LEGS = ["Derecha", "Izquierda"];

const EMPTY_PROFILE = {
  fullName: "",
  username: "",
  age: "",
  email: "",
  phone: "",
  position: "",
  leg: "",
  bio: "",
  photo:
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",

  // Por ahora estas estadísticas siguen siendo mock
  matchesPlayed: 42,
  rating: 4.8,
  reviews: 15,
};

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        const data = await getMe(token);

        const realProfile = {
          ...EMPTY_PROFILE,
          fullName: data.username,
          username: `@${data.username}`,
          age:
            data.edad !== null && data.edad !== undefined
              ? `${data.edad} años`
              : "Sin especificar",
          email: data.email,
          phone: data.telefono || "Sin especificar",
          position: data.posicion || "",
          leg: data.pierna_habil || "",
          bio: data.bio || "Sin biografía.",
        };

        setProfile(realProfile);
        setDraft(realProfile);
      } catch (error) {
        console.error("Error al cargar el perfil:", error);

        if (error.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setProfileError("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const setField = (field) => (value) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }));
  };

  const startEditing = () => {
    setDraft(profile);
    setProfileError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setProfileError("");
    setIsEditing(false);
  };

  const saveChanges = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const edadEncontrada = String(draft.age).match(/\d+/);

    const datos = {
      edad: edadEncontrada
        ? Number(edadEncontrada[0])
        : null,
      telefono:
        draft.phone === "Sin especificar"
          ? ""
          : draft.phone.trim(),
      posicion: draft.position,
      pierna_habil: draft.leg,
      bio:
        draft.bio === "Sin biografía."
          ? ""
          : draft.bio.trim(),
    };

    try {
      await updateMe(token, datos);

      const updatedProfile = {
        ...draft,
        age:
          datos.edad !== null
            ? `${datos.edad} años`
            : "Sin especificar",
        phone:
          datos.telefono || "Sin especificar",
        bio:
          datos.bio || "Sin biografía.",
      };

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setProfileError("");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);

      if (error.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setProfileError("No se pudieron guardar los cambios.");
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login", {
        replace: true,
      });
    }
  };

  const data = isEditing ? draft : profile;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-neutral-100">
        <Header />

        <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 dark:text-neutral-400">
            Cargando perfil...
          </p>
        </main>

        <BottomNavbar />
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen bg-slate-100 text-slate-900
        transition-colors
        dark:bg-slate-950 dark:text-neutral-100
      "
    >
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
        {/* Encabezado de la pantalla */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mi perfil
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 sm:text-base">
            Administra tu información personal, estadísticas y preferencias.
          </p>
        </div>

        {profileError && (
          <p className="mb-4 text-center text-sm text-red-500">
            {profileError}
          </p>
        )}

        {/* Sección principal que agrupa todo el perfil */}
        <section
          className="
            rounded-3xl border border-slate-200
            bg-white p-4 shadow-sm
            transition-colors
            dark:border-slate-950 dark:bg-slate-900
            sm:p-6 lg:p-8
          "
        >
          {/* Encabezado interno */}
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-950">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                Perfil de jugador
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                Tu información, estadísticas y preferencias.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/amigos")}
              className="
                flex shrink-0 items-center gap-2
                rounded-xl px-4 py-2.5
                font-semibold text-slate-700
                transition-colors hover:bg-slate-100
                dark:text-neutral-200
                dark:hover:bg-neutral-800
              "
            >
              <Users size={19} className="text-green-500" />
              <span>Amigos</span>
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Información personal */}
            <Card icon={User} title="Información personal" className="h-fit">
              <Avatar
                src={data.photo}
                alt={data.fullName}
                editable={isEditing}
                onChangePhoto={setField("photo")}
              />

              <div className="mt-5 text-center">
                <h2 className="text-2xl font-bold">
                  {profile.fullName}
                </h2>

                {/* El nombre de usuario nunca es editable */}
                <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  {profile.username}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <InfoRow
                  icon={Calendar}
                  value={data.age}
                  editable={isEditing}
                  onChange={setField("age")}
                  ariaLabel="Edad"
                />

                {/* El correo nunca es editable */}
                <InfoRow
                  icon={Mail}
                  value={profile.email}
                  ariaLabel="Correo electrónico"
                />

                <InfoRow
                  icon={Phone}
                  value={data.phone}
                  editable={isEditing}
                  onChange={setField("phone")}
                  ariaLabel="Teléfono"
                />
              </div>
            </Card>

            {/* Estadísticas */}
            <Card
              icon={BarChart3}
              title="Estadísticas"
              className="h-fit"
            >
              <div
                className="
                  rounded-xl border border-slate-200
                  bg-slate-50 py-10 text-center
                  dark:border-slate-950 dark:bg-slate-900
                "
              >
                <p className="text-6xl font-extrabold text-green-500 dark:text-green-400">
                  {profile.matchesPlayed}
                </p>

                <p className="mt-2 text-sm tracking-widest text-slate-500 dark:text-neutral-400">
                  PARTIDOS JUGADOS
                </p>
              </div>

              <div
                className="
                  mt-4 rounded-xl border border-slate-200
                  bg-slate-50 p-5
                  dark:border-slate-950 dark:bg-slate-900
                "
              >
                <p className="text-sm tracking-widest text-slate-600 dark:text-neutral-300">
                  REPUTACIÓN
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={
                          star <= Math.round(profile.rating)
                            ? "fill-green-500 text-green-500 dark:fill-green-400 dark:text-green-400"
                            : "text-slate-300 dark:text-neutral-600"
                        }
                      />
                    ))}
                  </div>

                  <p className="text-2xl font-bold">
                    {profile.rating}

                    <span className="ml-1 text-sm font-normal text-slate-500 dark:text-neutral-400">
                      / 5.0
                    </span>
                  </p>
                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                  Basado en {profile.reviews} reseñas de compañeros.
                </p>
              </div>
            </Card>

            {/* Preferencias */}
            <Card
              icon={Settings}
              title="Preferencias"
              className="h-fit"
            >
              <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                Posición preferida
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {POSITIONS.map((position) => (
                  <OptionPill
                    key={position}
                    label={position}
                    selected={data.position === position}
                    disabled={!isEditing}
                    onClick={() => setField("position")(position)}
                  />
                ))}
              </div>

              <p className="mt-6 text-sm font-medium text-slate-600 dark:text-neutral-400">
                Pierna hábil
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {LEGS.map((leg) => (
                  <OptionPill
                    key={leg}
                    label={leg}
                    selected={data.leg === leg}
                    disabled={!isEditing}
                    onClick={() => setField("leg")(leg)}
                  />
                ))}
              </div>

              <p className="mt-6 text-sm font-medium text-slate-600 dark:text-neutral-400">
                Biografía
              </p>

              <textarea
                value={data.bio}
                readOnly={!isEditing}
                aria-label="Biografía"
                rows={6}
                onChange={(event) =>
                  setField("bio")(event.target.value)
                }
                className={`
                  mt-3 w-full resize-none rounded-xl border
                  border-slate-200 bg-slate-50 p-4
                  text-sm font-medium leading-relaxed text-slate-900
                  outline-none transition-colors
                  dark:border-slate-950 dark:bg-slate-900
                  dark:text-neutral-100
                  ${
                    isEditing
                      ? "focus:border-green-500"
                      : "cursor-default"
                  }
                `}
              />
            </Card>
          </div>
        </section>

        {/* Acciones generales del perfil */}
        <div className="mx-auto mt-6 max-w-xl space-y-3">
          {isEditing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={saveChanges}
                className="
                  w-full rounded-xl bg-green-500 py-4
                  font-bold text-neutral-950
                  transition-colors hover:bg-green-400
                "
              >
                Guardar cambios
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                className="
                  w-full rounded-xl border border-slate-300
                  bg-white py-4 font-semibold text-slate-700
                  transition-colors hover:bg-slate-100
                  dark:border-neutral-700 dark:bg-slate-950
                  dark:text-neutral-200 dark:hover:bg-neutral-800
                "
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="
                w-full rounded-xl bg-green-500 py-4
                font-bold text-neutral-950
                transition-colors hover:bg-green-400
              "
            >
              Editar perfil
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full rounded-xl border border-red-500/60
              bg-transparent py-4 font-semibold text-red-500
              transition-colors hover:bg-red-500/10
              dark:text-red-400
            "
          >
            Cerrar sesión
          </button>
        </div>
      </main>

      <BottomNavbar />
    </div>
  );
}