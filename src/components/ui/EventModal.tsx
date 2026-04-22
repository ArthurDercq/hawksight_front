import { useState, useEffect } from 'react';
import type { EventFormData, EventType, GoalType, TrainingEvent } from '@/types';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<boolean>;
  initialDate?: string;
  editEvent?: TrainingEvent; // si fourni → mode édition
}

const EVENT_TYPES: EventType[] = ['Run', 'Trail', 'Bike', 'Swim', 'Hike', 'Ultra', 'Other'];
const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'finish', label: 'Finisher' },
  { value: 'time_goal', label: 'Objectif chrono' },
  { value: 'podium', label: 'Podium' },
  { value: 'discovery', label: 'Découverte' },
];

const inputCls = 'w-full bg-charcoal-light/50 border border-steel/50 rounded-lg px-3 py-2 text-mist text-sm focus:outline-none focus:border-amber/50 transition-colors';
const labelCls = 'block font-mono text-[10px] uppercase tracking-widest text-mist/40 mb-1';

function eventToForm(event: TrainingEvent): EventFormData {
  return {
    name: event.name,
    date: event.date.slice(0, 10),
    type: event.type,
    distance_km: event.distance_km ?? undefined,
    elevation_m: event.elevation_m ?? undefined,
    location: event.location ?? undefined,
    goal_type: event.goal_type ?? undefined,
  };
}

export function EventModal({ open, onClose, onSubmit, initialDate, editEvent }: EventModalProps) {
  const isEdit = !!editEvent;

  const [form, setForm] = useState<EventFormData>(
    editEvent ? eventToForm(editEvent) : { name: '', date: initialDate ?? '', type: 'Trail' }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resync form quand editEvent change (ex: on ouvre sur un event différent)
  useEffect(() => {
    if (editEvent) {
      setForm(eventToForm(editEvent));
    } else {
      setForm({ name: '', date: initialDate ?? '', type: 'Trail' });
    }
    setError(null);
  }, [editEvent, initialDate, open]);

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
      setError(isEdit ? 'Erreur lors de la modification' : 'Erreur lors de la création');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-charcoal border border-steel/40 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30">
              <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isEdit
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                }
              </svg>
            </div>
            <h2 className="font-heading font-semibold text-mist text-sm">
              {isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
          </div>
          <button onClick={onClose} className="text-mist/40 hover:text-mist transition-colors text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nom *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ultra-Trail du Mont-Blanc" className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value as EventType)} className={inputCls}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Distance (km)</label>
              <input type="number" step="0.1" min="0" value={form.distance_km ?? ''} onChange={e => set('distance_km', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="42.2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Dénivelé (m)</label>
              <input type="number" min="0" value={form.elevation_m ?? ''} onChange={e => set('elevation_m', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2500" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Lieu</label>
            <input type="text" value={form.location ?? ''} onChange={e => set('location', e.target.value || undefined)} placeholder="Chamonix, France" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Objectif</label>
            <select value={form.goal_type ?? ''} onChange={e => set('goal_type', e.target.value || undefined)} className={inputCls}>
              <option value="">— Aucun —</option>
              {GOAL_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-steel/50 text-mist/60 text-sm hover:text-mist hover:border-steel transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || !form.name || !form.date} className="flex-1 px-4 py-2 rounded-lg bg-amber text-charcoal text-sm font-semibold hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
