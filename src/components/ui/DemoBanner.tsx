const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export function DemoBanner() {
  return (
    <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-2.5 text-sm text-amber/80">
      <EyeIcon />
      <span>Mode démonstration — Les actions d'écriture sont désactivées.</span>
    </div>
  );
}
