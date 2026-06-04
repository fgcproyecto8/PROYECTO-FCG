import { Link } from "react-router-dom";
import ball from "../assets/pelota.png";

export default function FormContainer({ title, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* LOGO + NOMBRE */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2">
            
            {/* 🟢 PELOTA */}
            <img src={ball} alt="Pelota" className="w-6 h-6" />

            {/* TEXTO */}
            <span className="text-2xl font-bold tracking-tight">
              Partido<span className="text-brand">Ya</span>
            </span>
          </Link>
        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
            {title}
          </h1>
          {children}
        </div>

        {/* FOOTER */}
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}