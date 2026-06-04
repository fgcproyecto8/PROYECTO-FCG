import { Link } from "react-router-dom";

export default function FormContainer({ title, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand text-white font-bold">
              P
            </span>
            <span className="text-2xl font-bold tracking-tight">
              Partido<span className="text-brand">Ya</span>
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-center">{title}</h1>
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
