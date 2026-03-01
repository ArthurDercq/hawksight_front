import { useState, useMemo, useEffect } from 'react';
import { useActivities, usePermissions } from '@/hooks';
import { ActivityCard } from '@/components/activity';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { PageStateWrapper } from '@/components/ui/PageStateWrapper';
import { DemoBanner } from '@/components/ui/DemoBanner';
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

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function ActivitiesPage() {
  const { activities, isLoading, error, mutationError, createActivity, updateActivity, deleteActivity } = useActivities();
  const { isDemo, canWrite, canDelete } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);

  // Search filters
  const [searchName, setSearchName] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchName = !searchName || a.name.toLowerCase().includes(searchName.toLowerCase());
      const actDate = a.start_date ? a.start_date.slice(0, 10) : '';
      const matchFrom = !searchDateFrom || actDate >= searchDateFrom;
      const matchTo = !searchDateTo || actDate <= searchDateTo;
      return matchName && matchFrom && matchTo;
    });
  }, [activities, searchName, searchDateFrom, searchDateTo]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchName, searchDateFrom, searchDateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  return (
    <PageStateWrapper
      isLoading={isLoading}
      error={error}
      icon={<ActivityIcon />}
      title="Mes activites"
      loadingMessage="Chargement des activites..."
    >
    <div className="max-w-7xl mx-auto px-6">
      {/* Demo mode banner */}
      {isDemo && <DemoBanner />}

      {/* Header with SectionTitle */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <SectionTitle
            icon={<ActivityIcon />}
            title="Mes activites"
            subtitle={`${activities.length} activites au total`}
          />
        </div>
        {canWrite && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-light text-charcoal font-medium rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/30 mt-1"
          >
            <PlusIcon />
            Nouvelle activite
          </button>
        )}
      </div>

      {/* Mutation Error Banner */}
      {mutationError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-400 text-sm">{mutationError}</p>
        </div>
      )}

      {/* Search bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mist/40 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-steel/20 border border-steel/30 rounded-lg text-mist text-sm focus:border-amber focus:outline-none transition-colors placeholder:text-mist/30"
          />
        </div>
        <input
          type="date"
          value={searchDateFrom}
          onChange={(e) => setSearchDateFrom(e.target.value)}
          className="px-3 py-2 bg-steel/20 border border-steel/30 rounded-lg text-mist text-sm focus:border-amber focus:outline-none transition-colors"
        />
        <span className="text-mist/40 text-sm">→</span>
        <input
          type="date"
          value={searchDateTo}
          onChange={(e) => setSearchDateTo(e.target.value)}
          className="px-3 py-2 bg-steel/20 border border-steel/30 rounded-lg text-mist text-sm focus:border-amber focus:outline-none transition-colors"
        />
        {(searchName || searchDateFrom || searchDateTo) && (
          <>
            <button
              onClick={() => { setSearchName(''); setSearchDateFrom(''); setSearchDateTo(''); }}
              className="px-3 py-2 bg-steel/20 hover:bg-steel/30 border border-steel/30 rounded-lg text-mist/60 hover:text-mist transition-all"
              title="Effacer les filtres"
            >
              <XIcon />
            </button>
            <span className="text-amber text-xs font-mono">
              {filteredActivities.length} résultat{filteredActivities.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="card-glass rounded-lg p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            {activities.length === 0 ? (
              <>
                <p className="text-mist/60 text-lg mb-4">Aucune activite pour le moment</p>
                {canWrite && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-light text-charcoal font-medium rounded-lg transition-all hover:-translate-y-0.5"
                  >
                    <PlusIcon />
                    Creer votre premiere activite
                  </button>
                )}
              </>
            ) : (
              <p className="text-mist/60 text-lg">Aucune activite ne correspond aux filtres</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {paginatedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={canWrite ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
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
    </PageStateWrapper>
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
    distance: activity?.distance ?? 0,
    moving_time: activity?.moving_time ? activity.moving_time / 60 : 0,
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

    // Convert back to API format (distance already in km, moving_time in minutes → seconds)
    const apiData: ActivityFormData = {
      ...formData,
      moving_time: formData.moving_time * 60, // minutes to seconds
    };

    const success = await onSave(apiData);
    if (!success) {
      setIsSubmitting(false);
    }
  };

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <div
        className="card-glass rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
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
                <label className="block text-sm text-mist/70 mb-2">Durée</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={durationHours}
                    onChange={(e) => {
                      const h = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, moving_time: h * 60 + durationMins });
                    }}
                    required
                    className="w-16 px-2 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors text-center"
                  />
                  <span className="text-mist/50 text-sm">h</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMins}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, moving_time: durationHours * 60 + m });
                    }}
                    className="w-16 px-2 py-3 bg-steel/20 border border-steel/30 rounded-lg text-mist focus:border-amber focus:outline-none transition-colors text-center"
                  />
                  <span className="text-mist/50 text-sm">min</span>
                </div>
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
