import { useState, useMemo, useEffect } from 'react';
import { useActivities, usePermissions } from '@/hooks';
import { ActivityCard, ActivityModal } from '@/components/activity';
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'rgba(232,131,42,0.1)', border: '1px solid rgba(232,131,42,0.35)', borderRadius: '6px', color: '#E8832A', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '1px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,131,42,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,131,42,0.1)'; }}
          >
            <PlusIcon />
            Nouvelle activité
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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(242,242,242,0.2)', pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.35)', borderRadius: '6px', color: '#F2F2F2', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
          />
        </div>
        <input
          type="date"
          value={searchDateFrom}
          onChange={(e) => setSearchDateFrom(e.target.value)}
          style={{ padding: '7px 10px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.35)', borderRadius: '6px', color: 'rgba(242,242,242,0.6)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
        />
        <span style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>→</span>
        <input
          type="date"
          value={searchDateTo}
          onChange={(e) => setSearchDateTo(e.target.value)}
          style={{ padding: '7px 10px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.35)', borderRadius: '6px', color: 'rgba(242,242,242,0.6)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
        />
        {(searchName || searchDateFrom || searchDateTo) && (
          <>
            <button
              onClick={() => { setSearchName(''); setSearchDateFrom(''); setSearchDateTo(''); }}
              style={{ padding: '7px 10px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.35)', borderRadius: '6px', color: 'rgba(242,242,242,0.4)', cursor: 'pointer' }}
              title="Effacer les filtres"
            >
              <XIcon />
            </button>
            <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#E8832A' }}>
              {filteredActivities.length} résultat{filteredActivities.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div style={{ background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '8px', padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(58,63,71,0.3)' }} />
          <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(58,63,71,0.3)' }} />
          {activities.length === 0 ? (
            <>
              <p style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.25)', marginBottom: '16px' }}>Aucune activité pour le moment</p>
              {canWrite && (
                <button
                  onClick={handleCreate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'rgba(232,131,42,0.1)', border: '1px solid rgba(232,131,42,0.35)', borderRadius: '6px', color: '#E8832A', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  <PlusIcon />
                  Créer votre première activité
                </button>
              )}
            </>
          ) : (
            <p style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.25)' }}>Aucune activité ne correspond aux filtres</p>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '6px', color: currentPage === 1 ? 'rgba(242,242,242,0.2)' : 'rgba(242,242,242,0.5)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ArrowLeftIcon />
                Précédent
              </button>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', padding: '6px 16px', background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '6px' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(58,63,71,0.15)', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '6px', color: currentPage === totalPages ? 'rgba(242,242,242,0.2)' : 'rgba(242,242,242,0.5)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#0B0C10', border: '1px solid rgba(252,129,129,0.25)', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
            <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(252,129,129,0.35)' }} />
            <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(252,129,129,0.2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '7px', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.25)', borderRadius: '6px', color: '#fc8181' }}>
                <TrashIcon />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#F2F2F2' }}>Confirmer la suppression</h3>
            </div>
            <p style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.4)', marginBottom: '20px', lineHeight: 1.6 }}>
              Supprimer "{deleteConfirm.name}" ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: '6px 14px', background: 'rgba(58,63,71,0.2)', border: '1px solid rgba(58,63,71,0.35)', borderRadius: '6px', color: 'rgba(242,242,242,0.5)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                style={{ padding: '6px 14px', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.4)', borderRadius: '6px', color: '#fc8181', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
              >
                Supprimer
              </button>
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

