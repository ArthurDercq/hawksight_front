import { useState } from 'react';
import type { EventFormData, EventType, GoalType } from '@/types';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<boolean>;
  initialDate?: string;
}

const EVENT_TYPES: EventType[] = ['Run', 'Trail', 'Bike', 'Swim', 'Hike', 'Ultra', 'Other'];
const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'finish', label: 'Finisher' },
  { value: 'time_goal', label: 'Objectif chrono' },
  { value: 'podium', label: 'Podium' },
  { value: 'discovery', label: 'Découverte' },
];

const inputClass =
  'w-full bg-[#131417] border border-[#3A3F47]/50 rounded-lg px-3 py-2 text-mist text-sm focus:outline-none focus:border-amber/50 transition-colors';
const labelClass = 'block text-[10px] font-mono uppercase tracking-widest text-mist/40 mb-1';

export function EventModal({ open, onClose, onSubmit, initialDate }: EventModalProps) {
  const [form, setForm] = useState<EventFormData>({
    name: '',
    date: initialDate ?? '',
    type: 'Trail',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const set = (key: keyof EventFormData, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date) return;
    setIsSubmitting(true);
    setError(null);
    const ok = await onSubmit(form);
    setIsSubmitting(false);
    if (ok) {
      setForm({ name: '', date: initialDate ?? '', type: 'Trail' });
      onClose();
    } else {
      setError('Erreur lors de la création');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0B0C10] border border-[#3A3F47]/40 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30">
              <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              </svg>
            </div>
            <h2 className="font-heading font-semibold text-mist text-sm">Nouvel événement</h2>
          </div>
          <button onClick={onClose} className="text-mist/40 hover:text-mist transition-colors text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className={labelClass}>Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ultra-Trail du Mont-Blanc"
              className={inputClass}
              required
            />
          </div>

          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Type *</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value as EventType)}
                className={inputClass}
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Distance + Dénivelé */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.distance_km ?? ''}
                onChange={e => set('distance_km', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="42.2"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Dénivelé (m)</label>
              <input
                type="number"
                min="0"
                value={form.elevation_m ?? ''}
                onChange={e => set('elevation_m', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="2500"
                className={inputClass}
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className={labelClass}>Lieu</label>
            <input
              type="text"
              value={form.location ?? ''}
              onChange={e => set('location', e.target.value || undefined)}
              placeholder="Chamonix, France"
              className={inputClass}
            />
          </div>

          {/* Objectif */}
          <div>
            <label className={labelClass}>Objectif</label>
            <select
              value={form.goal_type ?? ''}
              onChange={e => set('goal_type', e.target.value || undefined)}
              className={inputClass}
            >
              <option value="">— Aucun —</option>
              {GOAL_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#3A3F47]/50 text-mist/60 text-sm hover:text-mist hover:border-[#3A3F47] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.date}
              className="flex-1 px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-semibold hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
