export default function Footer() {
  return (
    <footer className="px-8 py-8 mt-auto" style={{ borderTop: '1px solid #2A2A2A' }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase" style={{ letterSpacing: '0.5em', color: '#666666' }}>CAPSULE</span>
        <span className="font-mono text-[8px]" style={{ letterSpacing: '0.2em', color: '#333333' }}>
          © {new Date().getFullYear()} · TOUS DROITS RÉSERVÉS
        </span>
        <span className="font-mono text-[8px]" style={{ letterSpacing: '0.2em', color: '#333333' }}>
          PRECISION NUTRITION
        </span>
      </div>
    </footer>
  )
}
