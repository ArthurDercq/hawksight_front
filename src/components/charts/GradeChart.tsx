import { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import type { ActivityStream } from '@/types';

interface GradeChartProps {
  streams: ActivityStream[];
}

const COLORS = {
  glacier: '#3DB2E0',
};

export function GradeChart({ streams }: GradeChartProps) {
  const { chartData, hasData } = useMemo(() => {
    const distances = streams.map((s) => (s.distance_m / 1000).toFixed(2));
    const grades = streams.map((s) => s.grade_smooth || null);

    const hasValidData = grades.some((g) => g !== null);

    return {
      chartData: {
        labels: distances,
        datasets: [
          {
            data: grades,
            borderColor: COLORS.glacier,
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
        <p className="text-steel">Pas de donnees de pente</p>
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
        title: { display: true, text: 'Pente (%)', color: '#9ca3af' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  return <BaseChart data={chartData} options={options} />;
}
