/** Grano/noise cinematográfico sobre toda la interfaz. Puro CSS, sin coste de render. */
export default function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120] animate-grain bg-noise opacity-[0.06]"
      style={{ backgroundSize: "240px 240px" }}
      aria-hidden="true"
    />
  );
}
