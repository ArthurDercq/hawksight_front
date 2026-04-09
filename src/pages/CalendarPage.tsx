import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar, generateCalendarWeeks, useEvents } from '@/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { EventModal } from '@/components/ui/EventModal';
import type { CalendarDay, CalendarWeek } from '@/hooks';
import type { TrainingEvent } from '@/types';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SPORT_META, sportColor } from '@/services/utils/constants';

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// SVG Icons
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);


export function CalendarPage() {
  const { currentDate, activities, isLoading, error, previousMonth, nextMonth, goToToday } = useCalendar();
  const { events, createEvent } = useEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();

  const weeks = useMemo(() => {
    return generateCalendarWeeks(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      activities,
      events
    );
  }, [currentDate, activities]);

  const monthYear = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          icon={<CalendarIcon />}
          title="Calendrier"
          className="mb-6"
        />
        <div className="flex items-center justify-center py-12">
          <Spinner message="Chargement du calendrier..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          icon={<CalendarIcon />}
          title="Calendrier"
          className="mb-6"
        />
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header */}
      <SectionTitle
        icon={<CalendarIcon />}
        title="Calendrier"
        className="mb-6"
      />

      <div className="card-glass rounded-lg p-4 sm:p-6 relative overflow-hidden">

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 relative">
          <button
            onClick={previousMonth}
            className="inline-flex items-center gap-1 px-3 py-2 text-mist/60 hover:text-mist hover:bg-steel/20 rounded-lg transition-all hover:-translate-x-0.5"
          >
            <ChevronLeftIcon />
            Precedent
          </button>
          <div className="text-center">
            <h2 className="font-heading text-xl font-semibold text-mist">{monthYear}</h2>
            <button
              onClick={goToToday}
              className="text-sm text-amber hover:text-amber-light font-medium transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setModalInitialDate(undefined); setEventModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber text-sm hover:bg-amber/20 transition-all"
            >
              + Événement
            </button>
            <button
              onClick={nextMonth}
              className="inline-flex items-center gap-1 px-3 py-2 text-mist/60 hover:text-mist hover:bg-steel/20 rounded-lg transition-all hover:translate-x-0.5"
            >
              Suivant
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto relative">
          <div className="min-w-[700px]">
            {/* Weekday Headers */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-glacier py-2 bg-charcoal/50 rounded"
                >
                  {day}
                </div>
              ))}
              <div className="text-center text-sm font-semibold text-glacier py-2 bg-charcoal/50 rounded">
                Semaine
              </div>
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <CalendarWeekRow
                key={weekIndex}
                week={week}
                onAddEvent={(date) => { setModalInitialDate(date); setEventModalOpen(true); }}
              />
            ))}
          </div>
        </div>
      </div>

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={createEvent}
        initialDate={modalInitialDate}
      />
    </div>
  );
}

interface CalendarWeekRowProps {
  week: CalendarWeek;
  onAddEvent?: (date: string) => void;
}

function CalendarWeekRow({ week, onAddEvent }: CalendarWeekRowProps) {
  const { stats } = week;

  // Format time as XhYY (totalTime is in minutes from activity.moving_time)
  const hours = Math.floor(stats.totalTime / 60);
  const minutes = Math.floor(stats.totalTime % 60);
  const timeFormatted = stats.totalTime > 0
    ? `${hours}h${minutes.toString().padStart(2, '0')}`
    : '-';

  const distanceFormatted = stats.totalDistance > 0
    ? `${stats.totalDistance.toFixed(1)} km`
    : '-';

  // Average pace for Run & Trail only (time in minutes, distance in km)
  // Pace = total_minutes / distance_km gives minutes per km
  const avgPaceMinPerKm = stats.runTrailDistance > 0
    ? stats.runTrailTime / stats.runTrailDistance
    : 0;
  const paceMinutes = Math.floor(avgPaceMinPerKm);
  const paceSeconds = Math.round((avgPaceMinPerKm - paceMinutes) * 60);
  const paceFormatted = avgPaceMinPerKm > 0
    ? `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`
    : '-';

  return (
    <div className="grid grid-cols-8 gap-1 mb-1">
      {week.days.map((day, dayIndex) => (
        <CalendarDayCell key={dayIndex} day={day} onAddEvent={onAddEvent} />
      ))}
      {/* Week Stats */}
      <div className="bg-charcoal border border-steel/20 rounded p-2 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-mist/50">Dist:</span>
            <span className="text-amber font-mono">{distanceFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist/50">Temps:</span>
            <span className="text-mist font-mono">{timeFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist/50">Allure:</span>
            <span className="text-glacier font-mono">{paceFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalendarDayCellProps {
  day: CalendarDay;
}

interface CalendarDayCellProps {
  day: CalendarDay;
  onAddEvent?: (date: string) => void;
}

function CalendarDayCell({ day, onAddEvent }: CalendarDayCellProps) {
  const { date, isCurrentMonth, isToday, activities, events } = day;

  const uniqueSports = [...new Set(activities.map((a) => a.sport_type))];
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <div
      className={`
        min-h-[100px] rounded-lg p-2 transition-all group
        ${isCurrentMonth ? 'bg-steel/25 hover:bg-steel/40' : 'bg-steel/10 opacity-50'}
        ${isToday ? 'border-2 border-amber bg-amber/10' : 'border border-transparent'}
        ${events.length > 0 ? 'ring-1 ring-[#7B6BC8]/30' : ''}
      `}
    >
      {/* Day Number + add button */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${isToday ? 'text-amber' : isCurrentMonth ? 'text-mist' : 'text-mist/40'}`}>
          {date.getDate()}
        </span>
        {isCurrentMonth && onAddEvent && (
          <button
            onClick={() => onAddEvent(dateKey)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-mist/30 hover:text-amber text-base leading-none"
            title="Ajouter un événement"
          >
            +
          </button>
        )}
      </div>

      {/* Event badges */}
      {events.map((event: TrainingEvent) => (
        <div
          key={event.id}
          className="text-[10px] px-1.5 py-0.5 rounded font-medium w-full truncate mb-1 flex items-center gap-1"
          style={{ backgroundColor: 'rgba(123,107,200,0.2)', color: '#A89BE8', border: '1px solid rgba(123,107,200,0.4)' }}
          title={event.name}
        >
          <span>🏁</span>
          <span className="truncate">{event.name}</span>
        </div>
      ))}

      {/* Sport Badges */}
      <div className="flex flex-wrap gap-1">
        {uniqueSports.map((sport) => {
          const meta = SPORT_META[sport] ?? { bg: 'rgba(255,255,255,0.1)', color: '#F2F2F2' };
          const sportActivities = activities.filter((a) => a.sport_type === sport);
          return (
            <Link
              key={sport}
              to={`/activity/${sportActivities[0]?.id}`}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-all hover:scale-105"
              style={{ backgroundColor: meta.bg, color: sportColor(sport), border: `1px solid ${sportColor(sport)}40` }}
              title={sportActivities.map((a) => a.name).join(', ')}
            >
              {sport}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
