export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center w-full h-11 px-4 rounded-lg font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand hover:bg-brand-hover text-white shadow-sm",
    ghost:
      "bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
