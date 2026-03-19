import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    [key: string]: unknown;
  }>;
}

export function KPIHRZonesDoughnut({ chartData }: { chartData: ChartData }) {
  return (
    <Doughnut
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 12, 16, 0.95)',
            titleColor: '#F2F2F2',
            bodyColor: '#F2F2F2',
            titleFont: { family: 'Poppins' },
            bodyFont: { family: 'JetBrains Mono' },
            borderColor: 'rgba(61, 178, 224, 0.3)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return ` ${context.label}: ${context.parsed} activites (${percentage}%)`;
              },
            },
          },
        },
      }}
    />
  );
}
