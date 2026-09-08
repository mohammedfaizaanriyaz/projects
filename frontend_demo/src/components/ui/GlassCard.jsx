export default function GlassCard({
  children,
  className = "",
  glow = false
}) {
  return (
    <section
      className={[
        "glass-card",
        glow
          ? "glass-card--glow"
          : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
