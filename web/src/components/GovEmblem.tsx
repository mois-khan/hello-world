export function GovEmblem({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#1B4B8C" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="#FF9933" strokeWidth="1.5" />
      <g fill="#FF9933">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 24 + Math.cos(angle) * 6;
          const y1 = 24 + Math.sin(angle) * 6;
          const x2 = 24 + Math.cos(angle) * 16;
          const y2 = 24 + Math.sin(angle) * 16;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="1" />;
        })}
      </g>
      <circle cx="24" cy="24" r="5" fill="#138808" />
      <text x="24" y="27" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
        BT
      </text>
    </svg>
  );
}
