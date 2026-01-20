import { useMemo } from 'react';
import { TooltipItem } from 'chart.js';
import { BaseChart } from './BaseChart';
import type { Activity, ActivityStream } from '@/types';

interface PaceChartProps {
  activity: Activity;
  streams: ActivityStream[];
}

const COLORS = {
  glacier: '#3DB2E0',
};

export function PaceChart({ activity, streams }: PaceChartProps) {
  const { chartData, hasData } = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const paces = streams.map((s) => {
      if (!s.velocity_smooth || s.velocity_smooth === 0) return null;
      const kmh = s.velocity_smooth * 3.6;
      return 60 / kmh; // min/km
    });

    const hasValidData = paces.some((p) => p !== null);

    return {
      chartData: {
        labels: distances,
        datasets: [
          {
            label: 'Allure (min/km)',
            data: paces,
            borderColor: COLORS.glacier,
            backgroundColor: 'rgba(61, 178, 224, 0.2)',
            borderWidth: 2,
            fill: 'start' as const,
            tension: 0.3,
            pointRadius: 0,
            spanGaps: true,
          },
        ],
      },
      hasData: hasValidData,
    };
  }, [streams]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-steel">Pas de donnees d'allure</p>
      </div>
    );
  }

  const formatPace = (value: number) => {
    const minutes = Math.floor(value);
    const seconds = Math.round((value - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const pace = context.parsed.y;
            if (pace == null || !isFinite(pace)) return '';
            return `${formatPace(pace)} min/km`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Distance (km)', color: '#9ca3af' },
        ticks: { maxTicksLimit: 10, color: '#9ca3af' },
        grid: { display: false },
      },
      y: {
        reverse: true,
        min: 3,
        max: 9,
        grid: { display: false },
        ticks: {
          color: '#9ca3af',
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return formatPace(value);
            }
            return value;
          },
        },
      },
    },
  };

  return (
    <div>
      <div className="text-sm text-mist/70 mb-2">
        <span>
          Moy: <strong className="text-mist">{activity.speed_minutes_per_km_hms || '--'} /km</strong>
        </span>
      </div>
      <BaseChart data={chartData} options={options} />
    </div>
  );
}
