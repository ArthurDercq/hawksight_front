import { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import type { ActivityStream } from '@/types';

interface PowerChartProps {
  streams: ActivityStream[];
}

export function PowerChart({ streams }: PowerChartProps) {
  const { chartData, hasData } = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const power = streams.map((s) => s.power || null);

    const hasValidData = power.some((p) => p !== null);

    return {
      chartData: {
        labels: distances,
        datasets: [
          {
            data: power,
            borderColor: '#ffa502',
            backgroundColor: '#ffa50233',
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
    return null;
  }

  const options = {
    scales: {
      x: {
        title: { display: true, text: 'Distance (km)', color: '#9ca3af' },
        ticks: { maxTicksLimit: 10, color: '#9ca3af' },
      },
      y: {
        title: { display: true, text: 'Puissance (W)', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return <BaseChart data={chartData} options={options} />;
}
