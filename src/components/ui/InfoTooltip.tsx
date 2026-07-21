/**
 * InfoTooltip — bouton "i" avec infobulle "comment lire ce graphique",
 * réutilisable sur tous les graphes du module Analyse EF.
 *
 * Pas de lib de positionnement (aucune dépendance de ce type dans le repo) —
 * positionné bottom-full par défaut, suffisant pour un usage en header de
 * card. group-focus-within en plus de group-hover pour l'accessibilité
 * clavier (le bouton doit être atteignable au focus, pas seulement au survol).
 */
interface InfoTooltipProps {
  children: React.ReactNode;
  label?: string;
}

export function InfoTooltip({ children, label = 'Comment lire ce graphique' }: InfoTooltipProps) {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="w-4 h-4 rounded-full border border-steel/40 text-steel/70 hover:text-glacier hover:border-glacier/50 focus:text-glacier focus:border-glacier/50 flex items-center justify-center text-[9px] font-mono transition-colors"
      >
        i
      </button>
      <div
        role="tooltip"
        className="hw-card-dark invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 hw-text-caption text-mist/80 pointer-events-none"
      >
        {children}
      </div>
    </div>
  );
}
