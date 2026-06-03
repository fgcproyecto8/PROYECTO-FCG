import { Link } from "react-router-dom"
import { MapPin, Users, Plus, Sparkles, TrendingUp } from "lucide-react"

const user = { name: "asfd" }

function Home() {
  return (
    <div className="min-h-screen bg-[#020817] text-white p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">PartidoYa</h1>

        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold">
          A
        </div>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-r from-green-500/30 to-blue-500/20 rounded-3xl p-6">
        <p className="text-gray-400 text-sm">Hola,</p>

        <h2 className="text-2xl font-bold mt-1">
          {user.name} ⚽
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Sumate a un partido abierto o armá el tuyo con tus amigos.
        </p>

        <div className="flex gap-3 mt-4">
          <Link className="bg-green-500 px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={16} /> Crear partido
          </Link>

          <Link className="border border-gray-700 px-4 py-2 rounded-xl">
            Ver canchas
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Sparkles} value="0" label="Mis partidos" />
        <Stat icon={TrendingUp} value="1" label="Partidos abiertos" />
        <Stat icon={MapPin} value="3" label="Canchas" />
      </div>

      {/* CANCHAS */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Canchas destacadas</h3>
          <span className="text-green-400 text-sm">Ver todo</span>
        </div>

        <div className="flex gap-4 overflow-x-auto">
          <CourtCard name="La Bombonerita F5" price="$12.000" />
          <CourtCard name="Complejo River F5" price="$14.500" />
          <CourtCard name="Soccer Park" price="$9.800" />
        </div>
      </div>

      {/* NAVBAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#020817] border-t border-gray-800 flex justify-around py-3">
        <NavItem label="Inicio" active />
        <NavItem label="Buscar" />
        <NavItem label="Crear" />
        <NavItem label="Perfil" />
      </div>

    </div>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="bg-[#0f172a] p-4 rounded-2xl">
      <Icon className="text-green-400 mb-2" size={18} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function CourtCard({ name, price }) {
  return (
    <div className="bg-[#0f172a] p-4 rounded-2xl min-w-[200px]">
      <div className="h-24 bg-green-700/30 rounded-xl mb-3 flex items-center justify-center">
        🥅
      </div>

      <p className="font-bold text-sm">{name}</p>
      <p className="text-green-400 text-sm">{price}</p>
    </div>
  )
}

function NavItem({ label, active }) {
  return (
    <div className={`text-xs ${active ? "text-green-400" : "text-gray-500"}`}>
      {label}
    </div>
  )
}

export default Home