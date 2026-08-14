import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Users, Inbox } from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import UserCard from "../components/UserCard";

const MOCK_PLAYERS = [
  {
    id: 1,
    fullName: "Martín Pérez",
    username: "martinperez",
    photo: "https://i.pravatar.cc/150?img=12",
    position: "Mediocampista",
    rating: 4.7,
    matchesPlayed: 28,
  },
  {
    id: 2,
    fullName: "Carlos Ruiz",
    username: "cruiz10",
    photo: "https://i.pravatar.cc/150?img=33",
    position: "Delantero",
    rating: 4.9,
    matchesPlayed: 52,
  },
  {
    id: 3,
    fullName: "Lucas Gómez",
    username: "lgomez",
    photo: "https://i.pravatar.cc/150?img=15",
    position: "Portero",
    rating: 4.5,
    matchesPlayed: 15,
  },
  {
    id: 4,
    fullName: "Diego Fernández",
    username: "diegof",
    photo: "https://i.pravatar.cc/150?img=52",
    position: "Defensor",
    rating: 4.2,
    matchesPlayed: 34,
  },
  {
    id: 5,
    fullName: "Nicolás Sosa",
    username: "nicosa",
    photo: "https://i.pravatar.cc/150?img=68",
    position: "Mediocampista",
    rating: 4.6,
    matchesPlayed: 41,
  },
  {
    id: 6,
    fullName: "Julián Álvarez",
    username: "juli9",
    photo: "https://i.pravatar.cc/150?img=60",
    position: "Delantero",
    rating: 5.0,
    matchesPlayed: 77,
  },
];

const INITIAL_REQUESTS = [
  {
    id: 7,
    fullName: "Federico Ramos",
    username: "federamos",
    photo: "https://i.pravatar.cc/150?img=14",
    position: "Defensor",
    rating: 4.3,
    matchesPlayed: 22,
  },
  {
    id: 8,
    fullName: "Tomás Herrera",
    username: "tomiherrera",
    photo: "https://i.pravatar.cc/150?img=51",
    position: "Mediocampista",
    rating: 4.8,
    matchesPlayed: 39,
  },
  {
    id: 9,
    fullName: "Bruno Castro",
    username: "brunoc",
    photo: "https://i.pravatar.cc/150?img=59",
    position: "Portero",
    rating: 4.1,
    matchesPlayed: 18,
  },
];

const INITIAL_FRIENDS = [
  {
    id: 10,
    fullName: "Santiago Molina",
    username: "santimolina",
    photo: "https://i.pravatar.cc/150?img=11",
    position: "Delantero",
    rating: 4.4,
    matchesPlayed: 63,
  },
  {
    id: 11,
    fullName: "Iván Torres",
    username: "ivantorres",
    photo: "https://i.pravatar.cc/150?img=56",
    position: "Defensor",
    rating: 4.0,
    matchesPlayed: 29,
  },
];

const TABS = [
  { key: "search", label: "Buscar jugadores" },
  { key: "requests", label: "Solicitudes" },
  { key: "friends", label: "Mis amigos" },
];

export default function Friends() {
  const [activeTab, setActiveTab] = useState("search");
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const [sentRequests, setSentRequests] = useState([]);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [friends, setFriends] = useState(INITIAL_FRIENDS);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return MOCK_PLAYERS;
    }

    return MOCK_PLAYERS.filter((player) => {
      const fullName = player.fullName.toLowerCase();
      const username = player.username.toLowerCase();

      return (
        fullName.includes(normalizedQuery) ||
        username.includes(normalizedQuery)
      );
    });
  }, [query]);

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery(term);
  };

  const handleAdd = (user) => {
    setSentRequests((previousRequests) => {
      if (previousRequests.includes(user.id)) {
        return previousRequests;
      }

      return [...previousRequests, user.id];
    });
  };

  const handleAccept = (user) => {
    setRequests((previousRequests) =>
      previousRequests.filter((request) => request.id !== user.id)
    );

    setFriends((previousFriends) => {
      const alreadyExists = previousFriends.some(
        (friend) => friend.id === user.id
      );

      if (alreadyExists) {
        return previousFriends;
      }

      return [...previousFriends, user];
    });
  };

  const handleReject = (user) => {
    setRequests((previousRequests) =>
      previousRequests.filter((request) => request.id !== user.id)
    );
  };

  const handleRemoveFriend = (user) => {
    setFriends((previousFriends) =>
        previousFriends.filter((friend) => friend.id !== user.id)
    );
  };

  const handleViewProfile = (user) => {
    console.log("Perfil del usuario:", user);

    // Más adelante:
    // navigate(`/usuarios/${user.id}`);
  };

  const EmptyState = ({ icon: Icon, title, text, action }) => (
    <div
      className="
        flex flex-col items-center justify-center gap-3
        rounded-xl border border-dashed border-gray-300
        px-6 py-14 text-center
        dark:border-white/10
      "
    >
      <Icon size={32} className="text-gray-400 dark:text-gray-500" />

      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {text}
      </p>

      {action}
    </div>
  );

  return (
    <div
      className="
        flex min-h-screen flex-col
        bg-gray-50 text-gray-900
        dark:bg-slate-950 dark:text-white
      "
    >
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6">
        {/* Volver al perfil */}
        <Link
          to="/perfil"
          className="
            inline-flex items-center gap-2
            text-sm text-gray-600
            transition-colors hover:text-green-600
            dark:text-gray-400 dark:hover:text-green-400
          "
        >
          <ArrowLeft size={16} />
          Volver al perfil
        </Link>

        {/* Título */}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Amigos
        </h1>

        <p className="mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400">
          Encontrá jugadores, administrá tus solicitudes y conectate con otros
          usuarios.
        </p>

        {/* Contenedor principal */}
        <section
          className="
            mt-6 rounded-2xl border border-gray-200
            bg-white p-4 shadow-sm
            sm:p-6
            dark:border-white/10 dark:bg-white/[0.02]
          "
        >
          {/* Tabs */}
          <div
            className="
              -mx-1 flex gap-4 overflow-x-auto
              border-b border-gray-200 px-1
              dark:border-white/10
            "
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex shrink-0 items-center gap-2
                  border-b-2 px-1 pb-3
                  text-sm font-semibold transition-colors
                  sm:text-base
                  ${
                    activeTab === tab.key
                      ? "border-green-500 text-green-600 dark:text-green-400"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                  }
                `}
              >
                {tab.label}

                {tab.key === "requests" && requests.length > 0 && (
                  <span
                    className="
                      inline-flex h-5 min-w-5 items-center justify-center
                      rounded-full bg-green-500 px-1.5
                      text-xs font-bold text-white
                    "
                  >
                    {requests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Buscar jugadores */}
          {activeTab === "search" && (
            <div className="pt-5">
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="
                      pointer-events-none absolute left-3 top-1/2
                      -translate-y-1/2 text-gray-400
                    "
                  />

                  <input
                    type="text"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Buscar por nombre o nombre de usuario..."
                    className="
                      w-full rounded-xl border border-gray-300
                      bg-gray-50 py-3 pl-10 pr-4
                      text-sm outline-none transition-colors
                      placeholder:text-gray-400
                      focus:border-green-500
                      dark:border-white/10
                      dark:bg-slate-900
                      dark:text-white
                    "
                  />
                </div>

                <button
                  type="submit"
                  className="
                    rounded-xl bg-green-500
                    px-6 py-3 text-sm font-semibold text-white
                    transition-colors hover:bg-green-600
                  "
                >
                  Buscar
                </button>
              </form>

              <h2 className="mt-6 text-lg font-bold">
                Jugadores encontrados
              </h2>

              {results.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    icon={Search}
                    title="No encontramos jugadores"
                    text="Probá con otro nombre o nombre de usuario."
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      variant="search"
                      requestSent={sentRequests.includes(user.id)}
                      onAdd={handleAdd}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Solicitudes */}
          {activeTab === "requests" && (
            <div className="pt-5">
              {requests.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No tenés solicitudes pendientes"
                  text="Cuando alguien te envíe una solicitud, va a aparecer acá."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {requests.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      variant="request"
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mis amigos */}
          {activeTab === "friends" && (
            <div className="pt-5">
              {friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Todavía no agregaste amigos"
                  text="Buscá jugadores y empezá a armar tu grupo."
                  action={
                    <button
                      type="button"
                      onClick={() => setActiveTab("search")}
                      className="
                        mt-1 rounded-xl bg-green-500
                        px-5 py-2.5
                        text-sm font-semibold text-white
                        transition-colors hover:bg-green-600
                      "
                    >
                      Buscar jugadores
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {friends.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        variant="friend"
                        onViewProfile={handleViewProfile}
                        onRemove={handleRemoveFriend}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}