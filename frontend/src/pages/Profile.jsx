import React, { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

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
  ArrowLeft,
  UserPlus,
  Check,
} from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import Card from "../components/Card";
import InfoRow from "../components/InfoRow";
import OptionPill from "../components/OptionPill";
import Avatar from "../components/Avatar";

import {
  getMe,
  getUsuarioDetalle,
  updateMe,
  logoutUser,
  calificarUsuario,
  enviarSolicitudAmistad,
} from "../services/api.js";

import { DEFAULT_AVATAR } from "../utils/avatar.js";
import { primerError } from "../utils/apiErrors.js";

const POSITIONS = [
  "Delantero",
  "Mediocampista",
  "Defensor",
  "Portero",
];

const LEGS = ["Derecha", "Izquierda"];

const hoy = new Date();

const TODAY = [
  hoy.getFullYear(),
  String(hoy.getMonth() + 1).padStart(2, "0"),
  String(hoy.getDate()).padStart(2, "0"),
].join("-");

const EMPTY_PROFILE = {
  fullName: "",
  username: "",
  birthDate: "",
  age: "",
  email: "",
  phone: "",
  position: "",
  leg: "",
  bio: "",
  photo: DEFAULT_AVATAR,
  matchesPlayed: 0,
  rating: 0,
  reviews: 0,
};

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const { usuarioId } = useParams();

  const esPerfilPropio = !usuarioId;

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [photoFile, setPhotoFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [miCalificacion, setMiCalificacion] = useState(0);
  const [estadoAmistad, setEstadoAmistad] = useState("ninguna");

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
        setLoadingProfile(true);
        setProfileError("");

        const data = esPerfilPropio
          ? await getMe(token)
          : await getUsuarioDetalle(
              token,
              usuarioId
            );

        const realProfile = {
          ...EMPTY_PROFILE,

          fullName: data.username,

          username: `@${data.username}`,

          birthDate:
            data.fecha_nacimiento || "",

          age:
            data.edad !== null &&
            data.edad !== undefined
              ? `${data.edad} años`
              : "Sin especificar",

          email:
            data.email || "",

          phone:
            data.telefono ||
            "Sin especificar",

          position:
            data.posicion || "",

          leg:
            data.pierna_habil || "",

          bio:
            data.bio ||
            "Sin biografía.",

          photo:
            data.foto ||
            DEFAULT_AVATAR,

          matchesPlayed: 0,

          rating: Number(
            data.reputacion || 0
          ),

          reviews: Number(
            data.cantidad_calificaciones || 0
          ),
        };

        setProfile(realProfile);
        setDraft(realProfile);

        setMiCalificacion(
          Number(
            data.mi_calificacion || 0
          )
        );

        if (!esPerfilPropio) {
          setEstadoAmistad(
            data.estado_amistad ||
            "ninguna"
          );
        }
      } catch (error) {
        console.error(
          "Error al cargar el perfil:",
          error
        );

        if (error.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setProfileError(
          esPerfilPropio
            ? "No se pudo cargar tu perfil."
            : "No se pudo cargar el perfil del jugador."
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [
    navigate,
    usuarioId,
    esPerfilPropio,
  ]);

  const setField = (field) => (value) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }));
  };

  const handleChangePhoto = (
    file,
    previewUrl
  ) => {
    setPhotoFile(file);

    setDraft((previousDraft) => ({
      ...previousDraft,
      photo: previewUrl,
    }));
  };

  const startEditing = () => {
    setDraft(profile);
    setPhotoFile(null);
    setProfileError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setPhotoFile(null);
    setProfileError("");
    setIsEditing(false);
  };

  const handleAddFriend = async () => {
    if (
      esPerfilPropio ||
      estadoAmistad !== "ninguna"
    ) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      const response =
        await enviarSolicitudAmistad(
          token,
          usuarioId
        );

      setEstadoAmistad(
        response.estado
      );

      setProfileError("");
    } catch (error) {
      console.error(
        "Error al enviar solicitud:",
        error
      );

      setProfileError(
        error.data?.mensaje ||
          "No se pudo enviar la solicitud."
      );
    }
  };

  const saveChanges = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const telefono =
      draft.phone === "Sin especificar"
        ? ""
        : draft.phone.trim();

    const bio =
      draft.bio === "Sin biografía."
        ? ""
        : draft.bio.trim();

    const datos = new FormData();

    if (draft.birthDate) {
      datos.append(
        "fecha_nacimiento",
        draft.birthDate
      );
    }

    datos.append(
      "telefono",
      telefono
    );

    datos.append(
      "posicion",
      draft.position
    );

    datos.append(
      "pierna_habil",
      draft.leg
    );

    datos.append(
      "bio",
      bio
    );

    if (photoFile) {
      datos.append(
        "foto",
        photoFile
      );
    }

    try {
      const response =
        await updateMe(
          token,
          datos
        );

      const updatedProfile = {
        ...draft,

        birthDate:
          response.perfil
            ?.fecha_nacimiento ||
          draft.birthDate,

        age:
          response.perfil?.edad !==
            null &&
          response.perfil?.edad !==
            undefined
            ? `${response.perfil.edad} años`
            : "Sin especificar",

        phone:
          telefono ||
          "Sin especificar",

        bio:
          bio ||
          "Sin biografía.",

        photo:
          response.perfil?.foto ||
          profile.photo,
      };

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setPhotoFile(null);
      setProfileError("");
      setIsEditing(false);
    } catch (error) {
      console.error(
        "Error al actualizar el perfil:",
        error
      );

      if (error.status === 401) {
        localStorage.removeItem(
          "token"
        );
        localStorage.removeItem(
          "user"
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (error.data?.telefono) {
        setProfileError(
          primerError(error.data.telefono)
        );

        return;
      }

      if (error.data?.fecha_nacimiento) {
        setProfileError(
          primerError(error.data.fecha_nacimiento)
        );

        return;
      }

      setProfileError(
        "No se pudieron guardar los cambios."
      );
    }
  };

  const handleRate = async (valor) => {
    if (esPerfilPropio) {
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      const response =
        await calificarUsuario(
          token,
          usuarioId,
          valor
        );

      setMiCalificacion(
        response.mi_calificacion
      );

      setProfile(
        (previousProfile) => ({
          ...previousProfile,

          rating:
            response.reputacion,

          reviews:
            response.cantidad_calificaciones,
        })
      );

      setProfileError("");
    } catch (error) {
      console.error(
        "Error al calificar usuario:",
        error
      );

      setProfileError(
        error.data?.mensaje ||
          "No se pudo guardar la calificación."
      );
    }
  };

  const handleLogout = async () => {
    const token =
      localStorage.getItem("token");

    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error(
        "Error al cerrar sesión:",
        error
      );
    } finally {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      navigate("/login", {
        replace: true,
      });
    }
  };

  const handleVolver = () => {
    navigate("/amigos", {
      state: {
        activeTab:
          location.state
            ?.fromTab ||
          "search",
      },
    });
  };

  const data = isEditing
    ? draft
    : profile;

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

        <div className="mb-7">

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {esPerfilPropio
              ? "Mi perfil"
              : "Perfil de jugador"}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 sm:text-base">
            {esPerfilPropio
              ? "Administra tu información personal, estadísticas y preferencias."
              : "Información pública del jugador."}
          </p>

          {!esPerfilPropio && (
            <div className="mt-5">

              <button
                type="button"
                onClick={
                  handleVolver
                }
                className="
                  flex items-center gap-2 rounded-xl
                  border border-slate-300 bg-white
                  px-4 py-2.5 font-semibold text-slate-700
                  transition-colors hover:bg-slate-100
                  dark:border-slate-700 dark:bg-slate-900
                  dark:text-neutral-200 dark:hover:bg-slate-800
                "
              >
                <ArrowLeft size={18} />

                Volver
              </button>

            </div>
          )}

        </div>

        {profileError && (
          <p className="mb-4 text-center text-sm text-red-500">
            {profileError}
          </p>
        )}

        <section
          className="
            rounded-3xl border border-slate-200
            bg-white p-4 shadow-sm
            transition-colors
            dark:border-slate-950 dark:bg-slate-900
            sm:p-6 lg:p-8
          "
        >

          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-950">

            <div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                Perfil de jugador
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                {esPerfilPropio
                  ? "Tu información, estadísticas y preferencias."
                  : "Información, estadísticas y preferencias del jugador."}
              </p>

            </div>

            {esPerfilPropio ? (

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/amigos"
                  )
                }
                className="
                  flex shrink-0 items-center gap-2
                  rounded-xl px-4 py-2.5
                  font-semibold text-slate-700
                  transition-colors hover:bg-slate-100
                  dark:text-neutral-200
                  dark:hover:bg-neutral-800
                "
              >
                <Users
                  size={19}
                  className="text-green-500"
                />

                <span>
                  Amigos
                </span>

                <ChevronRight
                  size={17}
                />
              </button>

            ) : (

              <button
                type="button"
                disabled={
                  estadoAmistad !==
                  "ninguna"
                }
                onClick={
                  handleAddFriend
                }
                className={`
                  flex shrink-0 items-center gap-2
                  rounded-xl px-4 py-2.5
                  font-semibold transition-colors
                  ${
                    estadoAmistad ===
                    "ninguna"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "cursor-default bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }
                `}
              >

                {estadoAmistad ===
                "amigos" ? (
                  <>
                    <Check
                      size={18}
                    />
                    Amigos
                  </>
                ) : estadoAmistad ===
                  "enviada" ? (
                  <>
                    <Check
                      size={18}
                    />
                    Solicitud enviada
                  </>
                ) : estadoAmistad ===
                  "recibida" ? (
                  <>
                    <Check
                      size={18}
                    />
                    Solicitud recibida
                  </>
                ) : (
                  <>
                    <UserPlus
                      size={18}
                    />
                    Añadir amigo
                  </>
                )}

              </button>

            )}

          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

            <Card
              icon={User}
              title="Información personal"
              className="h-fit"
            >

              <Avatar
                src={data.photo}
                alt={data.fullName}
                editable={
                  esPerfilPropio &&
                  isEditing
                }
                onChangePhoto={
                  handleChangePhoto
                }
              />

              <div className="mt-5 text-center">

                <h2 className="text-2xl font-bold">
                  {
                    profile.fullName
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  {
                    profile.username
                  }
                </p>

              </div>

              <div className="mt-6 space-y-3">

                {esPerfilPropio &&
                isEditing ? (

                  <InfoRow
                    icon={Calendar}
                    value={
                      draft.birthDate
                    }
                    editable
                    onChange={setField(
                      "birthDate"
                    )}
                    type="date"
                    max={TODAY}
                    ariaLabel="Fecha de nacimiento"
                  />

                ) : (

                  <InfoRow
                    icon={Calendar}
                    value={
                      profile.age
                    }
                    ariaLabel="Edad"
                  />

                )}

                {esPerfilPropio && (
                  <>

                    <InfoRow
                      icon={Mail}
                      value={
                        profile.email
                      }
                      ariaLabel="Correo electrónico"
                    />

                    <InfoRow
                      icon={Phone}
                      value={
                        isEditing &&
                        draft.phone ===
                          "Sin especificar"
                          ? ""
                          : data.phone
                      }
                      editable={
                        isEditing
                      }
                      onChange={setField(
                        "phone"
                      )}
                      type="tel"
                      numericOnly
                      ariaLabel="Teléfono"
                    />

                  </>
                )}

              </div>

            </Card>

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
                  {
                    profile.matchesPlayed
                  }
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

                    {[1, 2, 3, 4, 5].map(
                      (star) => (

                        <Star
                          key={star}
                          size={20}
                          className={
                            star <=
                            Math.round(
                              profile.rating
                            )
                              ? "fill-green-500 text-green-500 dark:fill-green-400 dark:text-green-400"
                              : "text-slate-300 dark:text-neutral-600"
                          }
                        />

                      )
                    )}

                  </div>

                  <p className="text-2xl font-bold">
                    {profile.rating}

                    <span className="ml-1 text-sm font-normal text-slate-500 dark:text-neutral-400">
                      / 5.0
                    </span>
                  </p>

                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                  Basado en{" "}
                  {profile.reviews}{" "}
                  reseñas de compañeros.
                </p>

                {!esPerfilPropio && (

                  <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">

                    <p className="mb-2 text-sm font-medium text-slate-600 dark:text-neutral-300">
                      Tu calificación
                    </p>

                    <div className="flex gap-1">

                      {[1, 2, 3, 4, 5].map(
                        (star) => (

                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              handleRate(
                                star
                              )
                            }
                            className="transition-transform hover:scale-110"
                          >

                            <Star
                              size={26}
                              className={
                                star <=
                                miCalificacion
                                  ? "fill-green-500 text-green-500"
                                  : "text-slate-300 dark:text-neutral-600"
                              }
                            />

                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

            </Card>

            <Card
              icon={Settings}
              title="Preferencias"
              className="h-fit"
            >

              <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                Posición preferida
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {POSITIONS.map(
                  (position) => (

                    <OptionPill
                      key={position}
                      label={position}
                      selected={
                        data.position ===
                        position
                      }
                      disabled={
                        !esPerfilPropio ||
                        !isEditing
                      }
                      onClick={() =>
                        setField(
                          "position"
                        )(position)
                      }
                    />

                  )
                )}

              </div>

              <p className="mt-6 text-sm font-medium text-slate-600 dark:text-neutral-400">
                Pierna hábil
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {LEGS.map(
                  (leg) => (

                    <OptionPill
                      key={leg}
                      label={leg}
                      selected={
                        data.leg ===
                        leg
                      }
                      disabled={
                        !esPerfilPropio ||
                        !isEditing
                      }
                      onClick={() =>
                        setField(
                          "leg"
                        )(leg)
                      }
                    />

                  )
                )}

              </div>

              <p className="mt-6 text-sm font-medium text-slate-600 dark:text-neutral-400">
                Biografía
              </p>

              <textarea
                value={data.bio}
                readOnly={
                  !esPerfilPropio ||
                  !isEditing
                }
                aria-label="Biografía"
                rows={6}
                onChange={(event) =>
                  setField(
                    "bio"
                  )(
                    event.target
                      .value
                  )
                }
                className={`
                  mt-3 w-full resize-none rounded-xl border
                  border-slate-200 bg-slate-50 p-4
                  text-sm font-medium leading-relaxed text-slate-900
                  outline-none transition-colors
                  dark:border-slate-950 dark:bg-slate-900
                  dark:text-neutral-100
                  ${
                    esPerfilPropio &&
                    isEditing
                      ? "focus:border-green-500"
                      : "cursor-default"
                  }
                `}
              />

            </Card>

          </div>

        </section>

        {esPerfilPropio && (

          <div className="mx-auto mt-6 max-w-xl space-y-3">

            {isEditing ? (

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={
                    saveChanges
                  }
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
                  onClick={
                    cancelEditing
                  }
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
                onClick={
                  startEditing
                }
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
              onClick={
                handleLogout
              }
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

        )}

      </main>

      <BottomNavbar />

    </div>
  );
}