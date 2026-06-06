import { useState } from 'react';
import type { Activity, ActivityFormData } from '@/types';

const inputCls = 'w-full bg-charcoal-light/50 border border-steel/50 rounded-lg px-3 py-2 text-mist text-sm focus:outline-none focus:border-amber/50 transition-colors';
const inputSmCls = 'w-16 bg-charcoal-light/50 border border-steel/50 rounded-lg px-2 py-2 text-mist text-sm focus:outline-none focus:border-amber/50 transition-colors text-center';
const labelCls = 'block hw-text-caption uppercase tracking-widest text-mist/40 mb-1';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface ActivityModalProps {
  activity: Activity | null;
  onClose: () => void;
  onSave: (data: ActivityFormData) => Promise<boolean>;
}

export function ActivityModal({ activity, onClose, onSave }: ActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: activity?.name || '',
    sport_type: activity?.sport_type || 'Run',
    start_date: activity?.start_date
      ? new Date(activity.start_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    distance: activity?.distance ? Math.round(activity.distance * 100) / 100 : 0,
    moving_time: activity?.moving_time ?? 0,
    total_elevation_gain: activity?.total_elevation_gain || 0,
    average_heartrate: activity?.average_heartrate || undefined,
    max_heartrate: activity?.max_heartrate || undefined,
    average_cadence: activity?.average_cadence || undefined,
  });

  const durationHours = Math.floor(formData.moving_time / 60);
  const durationMins = Math.round(formData.moving_time % 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const apiData: ActivityFormData = {
      ...formData,
      moving_time: durationHours * 60 + durationMins,
    };
    const success = await onSave(apiData);
    if (!success) setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      onClick={onClose}
    >
      <div
        className="hw-card-dark p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber">
            <PlusIcon />
          </div>
          <h3 className="font-heading font-semibold text-mist text-sm">
            {activity ? "Modifier l'activité" : 'Nouvelle activité'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Type de sport</label>
            <select
              value={formData.sport_type}
              onChange={(e) => setFormData({ ...formData, sport_type: e.target.value as ActivityFormData['sport_type'] })}
              className={inputCls + ' cursor-pointer'}
            >
              <option value="Run">Course</option>
              <option value="Trail">Trail</option>
              <option value="Bike">Vélo</option>
              <option value="Swim">Natation</option>
              <option value="Hike">Randonnée</option>
              <option value="WeightTraining">Musculation</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Date et heure</label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Durée</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="23" value={durationHours}
                  onChange={(e) => {
                    const h = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, moving_time: h * 60 + durationMins });
                  }}
                  required
                  className={inputSmCls}
                />
                <span className="hw-text-caption text-steel">h</span>
                <input
                  type="number" min="0" max="59" value={durationMins}
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, moving_time: durationHours * 60 + m });
                  }}
                  className={inputSmCls}
                />
                <span className="hw-text-caption text-steel">min</span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Dénivelé positif (m)</label>
            <input
              type="number"
              value={formData.total_elevation_gain || ''}
              onChange={(e) => setFormData({ ...formData, total_elevation_gain: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>FC moyenne</label>
              <input
                type="number"
                value={formData.average_heartrate || ''}
                onChange={(e) => setFormData({ ...formData, average_heartrate: parseFloat(e.target.value) || undefined })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>FC max</label>
              <input
                type="number"
                value={formData.max_heartrate || ''}
                onChange={(e) => setFormData({ ...formData, max_heartrate: parseFloat(e.target.value) || undefined })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-steel/20">
            <button type="button" onClick={onClose} className="hw-btn-ghost">
              Annuler
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="hw-btn-amber disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
