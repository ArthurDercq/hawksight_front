import { useState } from 'react';
import { useActivities } from '@/hooks';
import { ActivityCard } from '@/components/activity';
import { SectionTitle } from '@/components/ui/SectionTitle';
import type { Activity, ActivityFormData } from '@/types';

const ITEMS_PER_PAGE = 10;

// SVG Icons
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export function ActivitiesPage() {
  const { activities, isLoading, error, createActivity, updateActivity, deleteActivity } = useActivities();
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);

  // Pagination
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowModal(true);
  };

  const handleDelete = (activity: Activity) => {
    setDeleteConfirm(activity);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const success = await deleteActivity(deleteConfirm.id);
      if (success) {
        setDeleteConfirm(null);
      }
    }
  };

  const handleCreate = () => {
    setEditingActivity(null);
    setShowModal(true);
  };

  const handleSave = async (data: ActivityFormData) => {
    let success: boolean;
    if (editingActivity) {
      success = await updateActivity(editingActivity.id, data);
    } else {
      success = await createActivity(data);
    }
    if (success) {
      setShowModal(false);
      setEditingActivity(null);
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle
            icon={<ActivityIcon />}
            title="Mes activites"
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement des activites...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle
            icon={<ActivityIcon />}
            title="Mes activites"
          />
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header with SectionTitle */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <SectionTitle
            icon={<ActivityIcon />}
            title="Mes activites"
            subtitle={`${activities.length} activites au total`}
          />
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-light text-charcoal font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/30 mt-1"
        >
          <PlusIcon />
          Nouvelle activite
        </button>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="card-glass rounded-lg p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            <p className="text-mist/60 text-lg mb-4">Aucune activite pour le moment</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-light text-charcoal font-medium rounded-lg transition-all hover:-translate-y-0.5"
            >
              <PlusIcon />
              Creer votre premiere activite
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {paginatedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 px-4 py-2 bg-steel/20 hover:bg-steel/30 disabled:opacity-50 disabled:cursor-not-allowed text-mist rounded-lg transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                <ArrowLeftIcon />
                Precedent
              </button>
              <span className="text-steel font-mono text-sm px-4 py-2 bg-charcoal/50 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 bg-steel/20 hover:bg-steel/30 disabled:opacity-50 disabled:cursor-not-allowed text-mist rounded-lg transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                Suivant
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-glass rounded-lg p-6 max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                  <TrashIcon />
                </div>
                <h3 className="font-heading text-lg font-semibold text-mist">
                  Confirmer la suppression
                </h3>
              </div>
              <p className="text-mist/70 mb-6">
                Etes-vous sur de vouloir supprimer l'activite "{deleteConfirm.name}" ?
                Cette action est irreversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-steel/30 hover:bg-steel/50 text-mist rounded-lg transition-all hover:-translate-y-0.5"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal (Create/Edit) */}
      {showModal && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => {
            setShowModal(false);
            setEditingActivity(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Activity Modal Component
interface ActivityModalProps {
  activity: Activity | null;
  onClose: () => void;
  onSave: (data: ActivityFormData) => Promise<boolean>;
}

function ActivityModal({ activity, onClose, onSave }: ActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: activity?.name || '',
    sport_type: activity?.sport_type || 'Run',
    start_date: activity?.start_date
      ? new Date(activity.start_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    distance: activity?.distance ? activity.distance / 1000 : 0,
    moving_time: activity?.moving_time ? activity.moving_time / 60 : 0,
    total_elevation_gain: activity?.total_elevation_gain || 0,
    average_heartrate: activity?.average_heartrate || undefined,
    max_heartrate: activity?.max_heartrate || undefined,
    average_cadence: activity?.average_cadence || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Convert back to API format
    const apiData: ActivityFormData = {
      ...formData,
      distance: formData.distance * 1000, // km to meters
      moving_time: formData.moving_time * 60, // minutes to seconds
    };

    await onSave(apiData);
    setIsSubmitting(false);
  };

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="card-glass rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        <div className="absolute inset-0 grid-pattern pointer-events-none rounded-lg" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber/10 border border-amber/30 text-amber">
              <PlusIcon />
            </div>
            <h3 className="font-heading text-lg font-semibold text-mist">
              {activity ? 'Modifier l\'activite' : 'Nouvelle activite'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-mist/70 mb-2">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
                className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
              />
            </div>

            {/* Sport Type */}
            <div>
              <label className="block text-sm text-mist/70 mb-2">Type de sport</label>
              <select
                value={formData.sport_type}
                onChange={(e) => setFormData({ ...formData, sport_type: e.target.value as ActivityFormData['sport_type'] })}
                className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors cursor-pointer"
              >
                <option value="Run">Course</option>
                <option value="Trail">Trail</option>
                <option value="Bike">Velo</option>
                <option value="Swim">Natation</option>
                <option value="Hike">Randonnee</option>
                <option value="WeightTraining">Musculation</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm text-mist/70 mb-2">Date et heure</label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
              />
            </div>

            {/* Distance & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-mist/70 mb-2">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-mist/70 mb-2">Duree (min)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.moving_time}
                  onChange={(e) => setFormData({ ...formData, moving_time: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Elevation */}
            <div>
              <label className="block text-sm text-mist/70 mb-2">Denivele positif (m)</label>
              <input
                type="number"
                value={formData.total_elevation_gain || ''}
                onChange={(e) => setFormData({ ...formData, total_elevation_gain: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
              />
            </div>

            {/* Heart Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-mist/70 mb-2">FC moyenne</label>
                <input
                  type="number"
                  value={formData.average_heartrate || ''}
                  onChange={(e) => setFormData({ ...formData, average_heartrate: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-mist/70 mb-2">FC max</label>
                <input
                  type="number"
                  value={formData.max_heartrate || ''}
                  onChange={(e) => setFormData({ ...formData, max_heartrate: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-steel/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-steel/30 hover:bg-steel/50 text-mist rounded-lg transition-all hover:-translate-y-0.5"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber hover:bg-amber-light disabled:opacity-50 text-charcoal font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/30"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
