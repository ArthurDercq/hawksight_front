import { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import type { ActivityStream } from '@/types';

interface CadenceChartProps {
  streams: ActivityStream[];
}

const COLORS = {
  moss: '#6DAA75',
};

export function CadenceChart({ streams }: CadenceChartProps) {
  const { chartData, hasData } = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const cadences = streams.map((s) => s.cadence || null);

    const hasValidData = cadences.some((c) => c !== null);

    return {
      chartData: {
        labels: distances,
        datasets: [
          {
            data: cadences,
            borderColor: COLORS.moss,
            backgroundColor: `${COLORS.moss}33`,
            fill: true,
            tension: 0.4,
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
        <p className="text-steel">Pas de donnees de cadence</p>
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
        title: { display: true, text: 'Cadence (rpm)', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return <BaseChart data={chartData} options={options} />;
}
