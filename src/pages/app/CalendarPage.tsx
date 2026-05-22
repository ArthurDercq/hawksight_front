import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar, generateCalendarWeeks, useEvents } from '@/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { EventModal } from '@/components/ui/EventModal';
import type { CalendarDay, CalendarWeek } from '@/hooks';
import type { TrainingEvent } from '@/types';
import { SPORT_META, sportColor } from '@/services/utils/constants';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const PlusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export function CalendarPage() {
  const { currentDate, activities, isLoading, error, previousMonth, nextMonth, goToToday } = useCalendar();
  const { events, createEvent } = useEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();

  const weeks = useMemo(
    () => generateCalendarWeeks(currentDate.getFullYear(), currentDate.getMonth(), activities, events),
    [currentDate, activities, events],
  );

  const monthYear = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const openEventModal = (date?: string) => {
    setModalInitialDate(date);
    setEventModalOpen(true);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-7">
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="hw-section-label mb-1">· Calendrier ·</p>
          <h1 className="hw-page-title">{monthYear}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="hw-btn-ghost" onClick={goToToday}>Aujourd'hui</button>
          <div className="hw-btn-group">
            <button className="hw-btn-group-item" onClick={previousMonth} aria-label="Mois précédent">
              <ChevronLeftIcon />
            </button>
            <div className="hw-btn-group-divider" />
            <button className="hw-btn-group-item" onClick={nextMonth} aria-label="Mois suivant">
              <ChevronRightIcon />
            </button>
          </div>
          <button className="hw-btn-amber" onClick={() => openEventModal()}>
            <PlusIcon /> Événement
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner message="Chargement du calendrier..." />
        </div>
      ) : error ? (
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="hw-text-data text-steel/85 uppercase tracking-wider">{error}</span>
        </div>
      ) : (
        <div className="hw-card-dark-lg">
          {/* Weekday headers */}
          <div className="grid gap-1 mb-1.5 grid-cols-[repeat(7,1fr)_90px]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center hw-text-label font-semibold text-glacier py-1.5">
                {day}
              </div>
            ))}
            <div className="text-center hw-text-label font-semibold text-steel py-1.5">
              S·W
            </div>
          </div>

          {/* Weeks */}
          <div className="flex flex-col gap-1">
            {weeks.map((week, i) => (
              <CalendarWeekRow key={i} week={week} onAddEvent={openEventModal} />
            ))}
          </div>
        </div>
      )}

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={createEvent}
        initialDate={modalInitialDate}
      />
    </div>
  );
}

// ── Week row ──────────────────────────────────────────────────────────────────
interface CalendarWeekRowProps {
  week: CalendarWeek;
  onAddEvent: (date: string) => void;
}

function CalendarWeekRow({ week, onAddEvent }: CalendarWeekRowProps) {
  const { stats } = week;

  const h = Math.floor(stats.totalTime / 60);
  const m = Math.floor(stats.totalTime % 60);
  const time   = stats.totalTime > 0 ? `${h}h${m.toString().padStart(2, '0')}` : '—';
  const dist   = stats.totalDistance > 0 ? stats.totalDistance.toFixed(1) : '—';

  const paceRaw = stats.runTrailDistance > 0 ? stats.runTrailTime / stats.runTrailDistance : 0;
  const pm = Math.floor(paceRaw);
  const ps = Math.round((paceRaw - pm) * 60);
  const pace = paceRaw > 0 ? `${pm}:${ps.toString().padStart(2, '0')}` : '—';

  const hasActivity = stats.totalDistance > 0;

  return (
    <div className="grid gap-1 grid-cols-[repeat(7,1fr)_90px]">
      {week.days.map((day, i) => (
        <CalendarDayCell key={i} day={day} onAddEvent={onAddEvent} />
      ))}

      {/* Week summary */}
      <div className={hasActivity ? 'hw-cal-week-stats hw-cal-week-stats--active' : 'hw-cal-week-stats'}>
        <div className="flex justify-between items-baseline">
          <span className="hw-text-label text-steel">km</span>
          <span className={`hw-text-data font-semibold ${hasActivity ? 'text-amber' : 'text-steel'}`}>{dist}</span>
        </div>
        <div className="h-px bg-steel/20" />
        <div className="flex justify-between items-baseline">
          <span className="hw-text-label text-steel">tps</span>
          <span className={`hw-text-caption tabular-nums ${hasActivity ? 'text-mist' : 'text-steel'}`}>{time}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="hw-text-label text-steel">/km</span>
          <span className={`hw-text-caption tabular-nums ${hasActivity ? 'text-glacier' : 'text-steel'}`}>{pace}</span>
        </div>
      </div>
    </div>
  );
}

// ── Day cell ──────────────────────────────────────────────────────────────────
interface CalendarDayCellProps {
  day: CalendarDay;
  onAddEvent: (date: string) => void;
}

function CalendarDayCell({ day, onAddEvent }: CalendarDayCellProps) {
  const { date, isCurrentMonth, isToday, activities, events } = day;
  const [hovered, setHovered] = useState(false);

  const uniqueSports = [...new Set(activities.map((a) => a.sport_type))];
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  const cellClass = isToday
    ? 'hw-cal-day hw-cal-day--today'
    : !isCurrentMonth
    ? 'hw-cal-day hw-cal-day--other-month'
    : 'hw-cal-day';

  return (
    <div
      className={cellClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Day number + add button */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`hw-text-data ${isToday ? 'font-bold text-amber' : isCurrentMonth ? 'font-medium text-mist' : 'text-steel'}`}>
          {date.getDate()}
        </span>
        {isCurrentMonth && hovered && (
          <button
            onClick={() => onAddEvent(dateKey)}
            className="flex items-center justify-center w-4 h-4 rounded bg-amber/10 border border-amber/20 text-amber cursor-pointer"
            title="Ajouter un événement"
          >
            <PlusIcon />
          </button>
        )}
      </div>

      {/* Event badges */}
      {events.map((event: TrainingEvent) => (
        <div key={event.id} className="hw-event-badge mb-1" title={event.name}>
          <span className="shrink-0">🏁</span>
          <span className="truncate">{event.name}</span>
        </div>
      ))}

      {/* Sport badges */}
      {uniqueSports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {uniqueSports.map((sport) => {
            const meta  = SPORT_META[sport] ?? { bg: 'rgba(255,255,255,0.08)' };
            const col   = sportColor(sport);
            const count = activities.filter((a) => a.sport_type === sport).length;
            const first = activities.find((a) => a.sport_type === sport);
            return (
              <Link
                key={sport}
                to={`/activity/${first?.id}`}
                className="hw-sport-badge"
                style={{ background: meta.bg, color: col, borderColor: `${col}30`, border: `1px solid ${col}30` }}
                title={activities.filter((a) => a.sport_type === sport).map((a) => a.name).join(', ')}
              >
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: col }} />
                {sport}{count > 1 ? ` ×${count}` : ''}
              </Link>
            );
          })}
        </div>
      )}

      {/* Today accent bar */}
      {isToday && (
        <div className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-amber/70 rounded-t" />
      )}
    </div>
  );
}
