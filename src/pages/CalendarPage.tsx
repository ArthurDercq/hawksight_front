import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar, generateCalendarWeeks } from '@/hooks';
import type { CalendarDay, CalendarWeek } from '@/hooks';
import type { SportType } from '@/types';
import { SectionTitle } from '@/components/ui/SectionTitle';

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

const SPORT_COLORS: Record<SportType, { bg: string; color: string }> = {
  Run: { bg: 'rgba(232, 131, 42, 0.2)', color: '#E8832A' },
  Trail: { bg: 'rgba(232, 131, 42, 0.2)', color: '#E8832A' },
  Bike: { bg: 'rgba(61, 178, 224, 0.2)', color: '#3DB2E0' },
  Swim: { bg: 'rgba(109, 170, 117, 0.2)', color: '#6DAA75' },
  Hike: { bg: 'rgba(109, 170, 117, 0.2)', color: '#6DAA75' },
  WeightTraining: { bg: 'rgba(58, 63, 71, 0.3)', color: '#9ca3af' },
};

export function CalendarPage() {
  const { currentDate, activities, isLoading, error, previousMonth, nextMonth, goToToday } = useCalendar();

  const weeks = useMemo(() => {
    return generateCalendarWeeks(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      activities
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
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement du calendrier...</p>
          </div>
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
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

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
          <button
            onClick={nextMonth}
            className="inline-flex items-center gap-1 px-3 py-2 text-mist/60 hover:text-mist hover:bg-steel/20 rounded-lg transition-all hover:translate-x-0.5"
          >
            Suivant
            <ChevronRightIcon />
          </button>
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
              <CalendarWeekRow key={weekIndex} week={week} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalendarWeekRowProps {
  week: CalendarWeek;
}

function CalendarWeekRow({ week }: CalendarWeekRowProps) {
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
        <CalendarDayCell key={dayIndex} day={day} />
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

function CalendarDayCell({ day }: CalendarDayCellProps) {
  const { date, isCurrentMonth, isToday, activities } = day;

  // Get unique sport types for the day
  const uniqueSports = [...new Set(activities.map((a) => a.sport_type))];

  return (
    <div
      className={`
        min-h-[100px] rounded-lg p-2 transition-all
        ${isCurrentMonth
          ? 'bg-steel/25 hover:bg-steel/40'
          : 'bg-steel/10 opacity-50'}
        ${isToday
          ? 'border-2 border-amber bg-amber/10'
          : 'border border-transparent'}
      `}
    >
      {/* Day Number */}
      <div
        className={`
          text-sm font-semibold mb-2
          ${isToday ? 'text-amber' : isCurrentMonth ? 'text-mist' : 'text-mist/40'}
        `}
      >
        {date.getDate()}
      </div>

      {/* Sport Badges */}
      <div className="flex flex-wrap gap-1">
        {uniqueSports.map((sport) => {
          const sportColor = SPORT_COLORS[sport] || { bg: 'rgba(255,255,255,0.1)', color: '#F2F2F2' };
          const sportActivities = activities.filter((a) => a.sport_type === sport);

          return (
            <Link
              key={sport}
              to={`/activity/${sportActivities[0]?.id}`}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: sportColor.bg,
                color: sportColor.color,
                border: `1px solid ${sportColor.color}40`,
              }}
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
