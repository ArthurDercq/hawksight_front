import { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import type { ActivityStream } from '@/types';

interface HeartrateChartProps {
  streams: ActivityStream[];
}

export function HeartrateChart({ streams }: HeartrateChartProps) {
  const { chartData, stats, hasData } = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const heartrates = streams.map((s) => s.heartrate || null);

    const validHR = heartrates.filter((hr): hr is number => hr !== null);
    const hasValidData = validHR.length > 0;

    const computedStats = hasValidData
      ? {
          avg: Math.round(validHR.reduce((a, b) => a + b, 0) / validHR.length),
          min: Math.min(...validHR),
          max: Math.max(...validHR),
        }
      : null;

    return {
      chartData: {
        labels: distances,
        datasets: [
          {
            label: 'Frequence cardiaque (bpm)',
            data: heartrates,
            borderColor: '#ff4757',
            backgroundColor: '#ff475722',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            spanGaps: true,
          },
        ],
      },
      stats: computedStats,
      hasData: hasValidData,
    };
  }, [streams]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-steel">Pas de donnees de frequence cardiaque</p>
      </div>
    );
  }

  const options = {
    scales: {
      x: {
        title: { display: true, text: 'Distance (km)', color: '#9ca3af' },
        ticks: { maxTicksLimit: 10, color: '#9ca3af' },
      },
      y: {
        title: { display: true, text: 'BPM', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return (
    <div>
      {stats && (
        <div className="flex gap-4 text-sm text-mist/70 mb-2">
          <span>
            Moy: <strong className="text-mist">{stats.avg} bpm</strong>
          </span>
          <span>
            Min: <strong className="text-mist">{stats.min} bpm</strong>
          </span>
          <span>
            Max: <strong className="text-mist">{stats.max} bpm</strong>
          </span>
        </div>
      )}
      <BaseChart data={chartData} options={options} />
    </div>
  );
}
