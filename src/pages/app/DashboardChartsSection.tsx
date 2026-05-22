import { Bar, Line, Doughnut, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { SectionTitle } from '@/components/ui/SectionTitle';
import type { ChartDataset } from '@/services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const REPARTITION_COLORS: Record<string, string> = {
  long: '#B85A1F',
  moyen: '#E8832A',
  court: '#3DB2E0',
};

function getRepartitionColor(label: string): string {
  const lowerLabel = label.toLowerCase();
  for (const [key, color] of Object.entries(REPARTITION_COLORS)) {
    if (lowerLabel.includes(key)) return color;
  }
  return '#E8832A';
}

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

interface Props {
  dailyHoursData: { labels: string[]; datasets: ChartDataset[] } | null;
  weekOffset: number;
  setWeekOffset: (v: number) => void;
  weekLabel: string;
  weekStats: { distance: number; elevation: number; time: string } | null;
  weeklyHoursData: { labels: string[]; datasets: ChartDataset[] } | null;
  weeklyHoursAverage: string;
  weeklyDistanceData: { labels: string[]; datasets: ChartDataset[] } | null;
  distanceSport: string;
  setDistanceSport: (v: string) => void;
  weeklyDistanceAverage: string;
  weeklyElevationAverage: string;
  repartitionData: { labels: string[]; datasets: ChartDataset[] } | null;
  repartitionSport: string;
  setRepartitionSport: (v: string) => void;
  repartitionWeeks: number;
  setRepartitionWeeks: (v: number) => void;
  weeklyPaceData: { labels: string[]; datasets: ChartDataset[] } | null;
  paceSport: string;
  setPaceSport: (v: string) => void;
  weeklyPaceAverage: string;
  conqueteData: { labels: string[]; datasets: ChartDataset[] } | null;
  conqueteAverage: string;
  globalOffset: number;
  setGlobalOffset: (v: number) => void;
  isRefetchingDailyHours: boolean;
  isRefetchingWeeklyHours: boolean;
  isRefetchingWeeklyDistance: boolean;
  isRefetchingRepartition: boolean;
  isRefetchingWeeklyPace: boolean;
  isRefetchingConquete: boolean;
}

export function DashboardChartsSection({
  dailyHoursData, weekOffset, setWeekOffset, weekLabel, weekStats,
  weeklyHoursData, weeklyHoursAverage,
  weeklyDistanceData, distanceSport, setDistanceSport, weeklyDistanceAverage, weeklyElevationAverage,
  repartitionData, repartitionSport, setRepartitionSport, repartitionWeeks, setRepartitionWeeks,
  weeklyPaceData, paceSport, setPaceSport, weeklyPaceAverage,
  conqueteData, conqueteAverage,
  globalOffset, setGlobalOffset,
  isRefetchingDailyHours, isRefetchingWeeklyHours, isRefetchingWeeklyDistance,
  isRefetchingRepartition, isRefetchingWeeklyPace, isRefetchingConquete,
}: Props) {
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2' } },
    },
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: '#F2F2F2', font: { size: 10 } } },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2', stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null } },
    },
    plugins: { legend: { display: false } },
  };

  // km/h axis — simple ordinal, labels converted back to min/km for display
  const speedData = (weeklyPaceData?.datasets?.[0]?.data ?? []) as (number | null)[];
  const validSpeeds = speedData.filter((s): s is number => s !== null && s > 0);
  const maxSpeed = validSpeeds.length ? Math.ceil(Math.max(...validSpeeds)) : 12;
  const fmtSpeedAsPace = (kmh: number) => { const p = 60 / kmh; const m = Math.floor(p); const s = Math.round((p - m) * 60); return `${m}:${s.toString().padStart(2, '0')}`; };

  const paceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        min: 0,
        max: maxSpeed,
        afterBuildTicks: (axis: { ticks: { value: number }[] }) => {
          axis.ticks = [{ value: maxSpeed / 2 }, { value: maxSpeed }];
        },
        ticks: {
          color: 'rgba(242,242,242,0.5)',
          font: { size: 10 },
          callback: (value: number | string) => {
            const v = Number(value);
            if (Math.abs(v - maxSpeed) < 0.01) return fmtSpeedAsPace(maxSpeed);
            if (Math.abs(v - maxSpeed / 2) < 0.01) return fmtSpeedAsPace(maxSpeed / 2);
            return null;
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: import('chart.js').TooltipItem<'bar'>) => {
            const rawVal = (context.dataset as { _rawPaces?: (number | null)[] })._rawPaces?.[context.dataIndex] ?? null;
            if (!rawVal) return '';
            const min = Math.floor(rawVal);
            const sec = Math.round((rawVal - min) * 60);
            return `${min}:${sec.toString().padStart(2, '0')} min/km`;
          },
        },
      },
    },
  };

  const barChartOptionsMinutes = {
    ...barChartOptions,
    scales: {
      ...barChartOptions.scales,
      y: {
        ...barChartOptions.scales.y,
        stacked: true,
        ticks: {
          color: '#F2F2F2',
          stepSize: 1,
          callback: (value: number | string) => Number.isInteger(Number(value)) ? `${Number(value)}` : null,
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: '#F2F2F2', font: { size: 11, family: 'JetBrains Mono' }, padding: 12 },
      },
    },
  };

  const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
  const gridStyle = { color: 'rgba(255,255,255,0.03)' };

  return (
    <div className="mt-8 mb-8">
      <SectionTitle icon={<BarChartIcon />} title="Analyses hebdomadaires" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Daily Hours */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-amber" />
          <span className="hw-br hw-br-br hw-br-amber-dark" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="hw-chart-title">Minutes d'activités quotidiennes</h3>
              {weekStats && (
                <p className="hw-chart-subtitle">
                  <span className="text-amber">{weekStats.distance.toFixed(1)} km</span>
                  {' · '}
                  <span className="text-glacier">{weekStats.elevation} D+</span>
                  {' · '}
                  <span>{weekStats.time}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="hw-chart-nav-btn">←</button>
              <span className="hw-chart-subtitle min-w-[100px] text-center">{weekLabel}</span>
              <button onClick={() => setWeekOffset(weekOffset - 1)} disabled={weekOffset <= 0} className="hw-chart-nav-btn">→</button>
            </div>
          </div>
          <div className={`h-[200px] relative transition-opacity duration-300 ${isRefetchingDailyHours ? 'opacity-50' : 'opacity-100'}`}>
            {dailyHoursData ? (
              <Bar
                data={{
                  labels: dailyHoursData.labels,
                  datasets: dailyHoursData.datasets?.length > 0
                    ? dailyHoursData.datasets.map((ds: ChartDataset) => ({
                        ...ds,
                        backgroundColor: ({ Run: '#3DB2E0', Trail: '#1E6A8F', Bike: '#7B6BC8', Swim: '#8B92A0', WeightTraining: '#9ca3af', Hike: '#5A5F6C' } as Record<string, string>)[ds.label] || '#3DB2E0',
                        borderColor: 'transparent',
                        borderRadius: 3,
                      }))
                    : [{ label: 'Aucune activité', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#3A3F47' }],
                }}
                options={{ ...barChartOptionsMinutes, scales: { x: { stacked: true, grid: { display: false }, ticks: axisStyle }, y: { stacked: true, grid: gridStyle, ticks: { ...axisStyle, stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null } } }, plugins: { legend: { display: true, position: 'bottom' as const, labels: { color: 'rgba(242,242,242,0.4)', font: { size: 10, family: 'JetBrains Mono' }, boxWidth: 10, padding: 10 } } } }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <span className="hw-br hw-br-br hw-br-glacier-dim" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="hw-chart-title">Heures d'activité par semaine</h3>
              <p className="hw-chart-subtitle">{weeklyHoursAverage}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setGlobalOffset(globalOffset + 1)} className="hw-chart-nav-btn">←</button>
              <span className="hw-chart-subtitle min-w-[72px] text-center">10 semaines</span>
              <button onClick={() => setGlobalOffset(globalOffset - 1)} disabled={globalOffset <= 0} className="hw-chart-nav-btn">→</button>
            </div>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingWeeklyHours ? 'opacity-50' : 'opacity-100'}`}>
            {weeklyHoursData && weeklyHoursData.datasets?.length > 0 ? (
              <Line
                data={{
                  labels: weeklyHoursData.labels,
                  datasets: weeklyHoursData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    borderColor: '#3DB2E0',
                    backgroundColor: 'rgba(61,178,224,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#3DB2E0',
                  })),
                }}
                options={{ ...lineChartOptions, scales: { x: { grid: { display: false }, ticks: axisStyle }, y: { grid: gridStyle, ticks: { ...axisStyle, stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}h` : null } } } }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>

        {/* Weekly Distance */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <span className="hw-br hw-br-br hw-br-glacier-dim" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="hw-chart-title">Kilomètres par semaine</h3>
              <span className="hw-chart-subtitle">{weeklyDistanceAverage} · <span className="text-amber-dark">{weeklyElevationAverage}</span></span>
            </div>
            <select value={distanceSport} onChange={(e) => setDistanceSport(e.target.value)} className="hw-chart-select">
              <option value="Run">Run</option>
              <option value="Trail">Trail</option>
              <option value="Bike">Bike</option>
              <option value="Swim">Swim</option>
              <option value="Run,Trail">Run & Trail</option>
            </select>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingWeeklyDistance ? 'opacity-50' : 'opacity-100'}`}>
            {weeklyDistanceData && weeklyDistanceData.datasets?.length > 0 ? (
              <Chart
                type="bar"
                data={{
                  labels: weeklyDistanceData.labels,
                  datasets: [
                    { ...weeklyDistanceData.datasets[0], type: 'bar' as const, backgroundColor: 'rgba(232, 131, 42, 0.8)', borderColor: '#E8832A', borderWidth: 1, borderRadius: 3, yAxisID: 'y' },
                    { ...weeklyDistanceData.datasets[1], type: 'line' as const, borderColor: '#C4561A', backgroundColor: 'rgba(196, 86, 26, 0.15)', borderWidth: 2, pointRadius: 2, fill: 'origin', tension: 0.4, yAxisID: 'y1' },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false }, ticks: { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } } },
                    y: { position: 'left' as const, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' }, callback: (v: number | string) => `${Number(v).toFixed(0)}` } },
                    y1: { position: 'right' as const, grid: { display: false }, ticks: { color: 'rgba(196,86,26,0.5)', font: { size: 10, family: 'JetBrains Mono' }, callback: (v: number | string) => `${Number(v).toFixed(0)}m` } },
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      backgroundColor: '#0B0C10',
                      borderColor: '#E8832A',
                      borderWidth: 1,
                      titleColor: '#F2F2F2',
                      bodyColor: '#A0A8B0',
                      titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
                      bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
                      padding: 10,
                      cornerRadius: 4,
                      displayColors: true,
                      callbacks: {
                        title: (items) => items[0]?.label ?? '',
                        label: (ctx) => {
                          if (ctx.datasetIndex === 0) return `  Distance : ${Number(ctx.raw).toFixed(1)} km`;
                          if (ctx.datasetIndex === 1) return `  D+        : ${Math.round(Number(ctx.raw))} m`;
                          return '';
                        },
                        labelColor: (ctx) => ({
                          borderColor: ctx.datasetIndex === 0 ? '#E8832A' : '#C4561A',
                          backgroundColor: ctx.datasetIndex === 0 ? '#E8832A' : '#C4561A',
                          borderRadius: 2,
                        }),
                      },
                    },
                  },
                }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>

        {/* Repartition */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-moss" />
          <span className="hw-br hw-br-br hw-br-moss" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="hw-chart-title">Répartition des activités</h3>
            <div className="flex gap-1.5">
              <select value={repartitionSport} onChange={(e) => setRepartitionSport(e.target.value)} className="hw-chart-select">
                <option value="Run,Trail">Run & Trail</option>
                <option value="Run">Run</option>
                <option value="Trail">Trail</option>
                <option value="Bike">Bike</option>
              </select>
              <select value={repartitionWeeks} onChange={(e) => setRepartitionWeeks(parseInt(e.target.value))} className="hw-chart-select">
                <option value={4}>Ce mois</option>
                <option value={8}>2 mois</option>
                <option value={12}>3 mois</option>
                <option value={24}>6 mois</option>
              </select>
            </div>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingRepartition ? 'opacity-50' : 'opacity-100'}`}>
            {repartitionData && repartitionData.datasets?.length > 0 ? (
              <Doughnut
                plugins={[ChartDataLabels]}
                data={{
                  labels: repartitionData.labels,
                  datasets: repartitionData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    backgroundColor: repartitionData.labels.map((label: string) => getRepartitionColor(label)),
                    borderColor: '#0B0C10',
                    borderWidth: 2,
                  })),
                }}
                options={{
                  ...doughnutChartOptions,
                  plugins: {
                    legend: { position: 'right' as const, labels: { color: 'rgba(242,242,242,0.4)', font: { size: 10, family: 'JetBrains Mono' }, padding: 12, boxWidth: 10 } },
                    datalabels: {
                      color: '#F2F2F2',
                      font: { size: 11, weight: 700, family: 'JetBrains Mono' },
                      formatter: (value: number) => value > 0 ? value : '',
                    },
                  },
                }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-moss" />
          <span className="hw-br hw-br-br hw-br-moss" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="hw-chart-title">Allure moyenne par semaine</h3>
              <p className="hw-chart-subtitle">{weeklyPaceAverage}</p>
            </div>
            <select value={paceSport} onChange={(e) => setPaceSport(e.target.value)} className="hw-chart-select">
              <option value="Run">Run</option>
              <option value="Trail">Trail</option>
              <option value="Bike">Bike</option>
              <option value="Swim">Swim</option>
              <option value="Run,Trail">Run & Trail</option>
            </select>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingWeeklyPace ? 'opacity-50' : 'opacity-100'}`}>
            {weeklyPaceData && weeklyPaceData.datasets?.length > 0 ? (
              <Bar
                data={{
                  labels: weeklyPaceData.labels,
                  datasets: weeklyPaceData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    backgroundColor: 'rgba(109,170,117,0.7)',
                    borderColor: '#6DAA75',
                    borderWidth: 1,
                    borderRadius: 3,
                  })),
                }}
                options={{ ...paceChartOptions, scales: { ...paceChartOptions.scales, x: { grid: { display: false }, ticks: axisStyle }, y: { ...paceChartOptions.scales.y, grid: gridStyle, ticks: { ...paceChartOptions.scales.y.ticks, color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } } } } }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>

        {/* Conquête */}
        <div className="hw-chart-card">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <span className="hw-br hw-br-br hw-br-glacier-dim" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="hw-chart-title">Taux de conquête</h3>
              <p className="hw-chart-subtitle">{conqueteAverage}</p>
            </div>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingConquete ? 'opacity-50' : 'opacity-100'}`}>
            {conqueteData && conqueteData.datasets?.length > 0 ? (
              <Bar
                data={{
                  labels: conqueteData.labels,
                  datasets: conqueteData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    backgroundColor: 'rgba(61,178,224,0.7)',
                    borderColor: '#3DB2E0',
                    borderWidth: 1,
                    borderRadius: 3,
                  })),
                }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: axisStyle }, y: { grid: gridStyle, ticks: { ...axisStyle, stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null } } }, plugins: { legend: { display: false } } }}
              />
            ) : <div className="hw-chart-empty">Pas de données</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
