import { useState, useMemo, useEffect } from 'react';
import { useActivities, usePermissions } from '@/hooks';
import { ActivityCard, ActivityModal } from '@/components/activity';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { PageStateWrapper } from '@/components/ui/PageStateWrapper';
import { DemoBanner } from '@/components/ui/DemoBanner';
import type { Activity, ActivityFormData } from '@/types';

const ITEMS_PER_PAGE = 10;

// ── Icons ─────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'bg-steel/15 border border-steel/35 rounded-md px-2.5 py-1.5 text-mist/60 text-xs font-mono outline-none focus:border-steel/60 transition-colors';

// ── Page ──────────────────────────────────────────────────────────────────────
export function ActivitiesPage() {
  const { activities, isLoading, error, mutationError, createActivity, updateActivity, deleteActivity } = useActivities();
  const { isDemo, canWrite, canDelete } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);
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

  useEffect(() => { setCurrentPage(1); }, [searchName, searchDateFrom, searchDateTo]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleEdit = (activity: Activity) => { setEditingActivity(activity); setShowModal(true); };
  const handleDelete = (activity: Activity) => setDeleteConfirm(activity);
  const handleCreate = () => { setEditingActivity(null); setShowModal(true); };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const success = await deleteActivity(deleteConfirm.id);
      if (success) setDeleteConfirm(null);
    }
  };

  const handleSave = async (data: ActivityFormData) => {
    const success = editingActivity
      ? await updateActivity(editingActivity.id, data)
      : await createActivity(data);
    if (success) { setShowModal(false); setEditingActivity(null); }
    return success;
  };

  const hasFilters = !!(searchName || searchDateFrom || searchDateTo);
  const clearFilters = () => { setSearchName(''); setSearchDateFrom(''); setSearchDateTo(''); };

  return (
    <PageStateWrapper isLoading={isLoading} error={error} icon={<ActivityIcon />} title="Mes activités" loadingMessage="Chargement des activités...">
      <div className="max-w-7xl mx-auto px-6">
        {isDemo && <DemoBanner />}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <SectionTitle icon={<ActivityIcon />} title="Mes activités" subtitle={`${activities.length} activités au total`} />
          </div>
          {canWrite && (
            <button onClick={handleCreate} className="hw-btn-amber">
              <PlusIcon /> Nouvelle activité
            </button>
          )}
        </div>

        {/* Mutation error */}
        {mutationError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400 text-sm">{mutationError}</p>
          </div>
        )}

        {/* Search bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist/20 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={`${inputCls} w-full pl-8 text-mist`}
            />
          </div>
          <input type="date" value={searchDateFrom} onChange={(e) => setSearchDateFrom(e.target.value)} className={inputCls} />
          <span className="hw-text-caption text-steel">→</span>
          <input type="date" value={searchDateTo} onChange={(e) => setSearchDateTo(e.target.value)} className={inputCls} />
          {hasFilters && (
            <>
              <button onClick={clearFilters} className={`${inputCls} cursor-pointer`} title="Effacer les filtres">
                <XIcon />
              </button>
              <span className="hw-text-caption text-amber">
                {filteredActivities.length} résultat{filteredActivities.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {/* Activities grid or empty state */}
        {filteredActivities.length === 0 ? (
          <div className="hw-card-dark p-12 text-center">
            <span className="hw-br hw-br-tl hw-br-steel" />
            <span className="hw-br hw-br-br hw-br-steel" />
            {activities.length === 0 ? (
              <>
                <p className="font-mono text-xs text-mist/25 mb-4">Aucune activité pour le moment</p>
                {canWrite && (
                  <button onClick={handleCreate} className="hw-btn-amber">
                    <PlusIcon /> Créer votre première activité
                  </button>
                )}
              </>
            ) : (
              <p className="font-mono text-xs text-mist/25">Aucune activité ne correspond aux filtres</p>
            )}
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
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="hw-btn-group inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeftIcon /> Précédent
                </button>
                <span className="font-mono text-xs text-steel px-4 py-1.5 bg-charcoal border border-steel/30 rounded-md">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="hw-btn-group inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Suivant <ArrowRightIcon />
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="hw-card-dark p-6 max-w-sm w-full">
              <span className="hw-br hw-br-tl hw-br-red" />
              <span className="hw-br hw-br-br hw-br-red-dim" />
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 bg-red-500/10 border border-red-500/25 rounded-md text-red-400">
                  <TrashIcon />
                </div>
                <h3 className="text-sm font-semibold text-mist">Confirmer la suppression</h3>
              </div>
              <p className="font-mono text-xs text-mist/40 mb-5 leading-relaxed">
                Supprimer "{deleteConfirm.name}" ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3.5 py-1.5 bg-steel/20 border border-steel/35 rounded-md text-mist/50 font-mono text-xs cursor-pointer hover:text-mist/70 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/40 rounded-md text-red-400 font-mono text-xs cursor-pointer hover:bg-red-500/20 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity modal */}
        {showModal && (
          <ActivityModal
            activity={editingActivity}
            onClose={() => { setShowModal(false); setEditingActivity(null); }}
            onSave={handleSave}
          />
        )}
      </div>
    </PageStateWrapper>
  );
}
