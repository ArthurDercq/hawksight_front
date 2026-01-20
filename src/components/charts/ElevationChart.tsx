import { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import type { ActivityStream } from '@/types';

interface ElevationChartProps {
  streams: ActivityStream[];
}

const COLORS = {
  glacier: '#3DB2E0',
};

export function ElevationChart({ streams }: ElevationChartProps) {
  const chartData = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const altitudes = streams.map((s) => s.altitude || 0);

    return {
      labels: distances,
      datasets: [
        {
          label: 'Altitude (m)',
          data: altitudes,
          borderColor: COLORS.glacier,
          backgroundColor: `${COLORS.glacier}33`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [streams]);

  const options = {
    aspectRatio: 3,
    scales: {
      x: {
        title: { display: true, text: 'Distance (km)', color: '#9ca3af' },
        ticks: { maxTicksLimit: 10, color: '#9ca3af' },
      },
      y: {
        title: { display: true, text: 'Altitude (m)', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return <BaseChart data={chartData} options={options} aspectRatio={3} />;
}
