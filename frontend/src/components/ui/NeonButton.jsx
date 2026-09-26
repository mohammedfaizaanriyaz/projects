export default function NeonButton({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  onClick
}) {
  return (
    <button
      type={type}
      className={`neon-button neon-button--${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
