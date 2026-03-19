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

  const paceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: import('chart.js').TooltipItem<'bar'>) => {
            const rawVal = (context.dataset as { _rawPaces?: number[] })._rawPaces?.[context.dataIndex] ?? context.parsed.y ?? 0;
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

  return (
    <div className="mt-8 mb-8">
      <SectionTitle icon={<BarChartIcon />} title="Analyses hebdomadaires" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Daily Hours */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-mist text-sm">Minutes d'activités quotidiennes</h3>
              {weekStats && (
                <div className="flex items-center gap-2 mt-1 text-xs text-mist/60 font-mono">
                  <span className="text-amber">{weekStats.distance.toFixed(1)} km</span>
                  <span>•</span>
                  <span className="text-glacier">{weekStats.elevation} D+</span>
                  <span>•</span>
                  <span>{weekStats.time}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist">←</button>
              <span className="text-xs text-mist/60 font-mono min-w-[100px] text-center">{weekLabel}</span>
              <button onClick={() => setWeekOffset(weekOffset - 1)} disabled={weekOffset <= 0} className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist disabled:opacity-30">→</button>
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
                        borderColor: ({ Run: '#3DB2E0', Trail: '#1E6A8F', Bike: '#7B6BC8', Swim: '#8B92A0', WeightTraining: '#9ca3af', Hike: '#5A5F6C' } as Record<string, string>)[ds.label] || '#3DB2E0',
                      }))
                    : [{ label: 'Aucune activité', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#3A3F47' }],
                }}
                options={barChartOptionsMinutes}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Chargement...</div>
            )}
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-mist text-sm">Heures d'activite par semaine</h3>
              <span className="text-xs text-mist/60 font-mono">{weeklyHoursAverage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setGlobalOffset(globalOffset + 1)} className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist">←</button>
              <span className="text-xs text-mist/60 font-mono">10 semaines</span>
              <button onClick={() => setGlobalOffset(globalOffset - 1)} disabled={globalOffset <= 0} className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist disabled:opacity-30">→</button>
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
                    backgroundColor: 'rgba(61, 178, 224, 0.1)',
                    fill: true,
                    tension: 0.4,
                  })),
                }}
                options={lineChartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
            )}
          </div>
        </div>

        {/* Weekly Distance */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-mist text-sm">Kilometres par semaine</h3>
              <span className="text-xs text-mist/60 font-mono">{weeklyDistanceAverage} · <span style={{ color: '#C4561A' }}>{weeklyElevationAverage}</span></span>
            </div>
            <select value={distanceSport} onChange={(e) => setDistanceSport(e.target.value)} className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier">
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
                    x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
                    y: { position: 'left' as const, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2', callback: (v: number | string) => `${Number(v).toFixed(0)}` } },
                    y1: { position: 'right' as const, grid: { display: false }, ticks: { color: '#C4561A', callback: (v: number | string) => `${Number(v).toFixed(0)}m` } },
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
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
            )}
          </div>
        </div>

        {/* Repartition */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-mist text-sm">Repartition des activites</h3>
            <div className="flex items-center gap-2">
              <select value={repartitionSport} onChange={(e) => setRepartitionSport(e.target.value)} className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier">
                <option value="Run,Trail">Run & Trail</option>
                <option value="Run">Run</option>
                <option value="Trail">Trail</option>
                <option value="Bike">Bike</option>
              </select>
              <select value={repartitionWeeks} onChange={(e) => setRepartitionWeeks(parseInt(e.target.value))} className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier">
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
                data={{
                  labels: repartitionData.labels,
                  datasets: repartitionData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    backgroundColor: repartitionData.labels.map((label: string) => getRepartitionColor(label)),
                    borderColor: '#0B0C10',
                    borderWidth: 2,
                  })),
                }}
                options={doughnutChartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
            )}
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-mist text-sm">Allure moyenne par semaine</h3>
              <span className="text-xs text-mist/60 font-mono">{weeklyPaceAverage}</span>
            </div>
            <select value={paceSport} onChange={(e) => setPaceSport(e.target.value)} className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier">
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
                    backgroundColor: 'rgba(109, 170, 117, 0.7)',
                    borderColor: '#6DAA75',
                    borderWidth: 1,
                    borderRadius: 3,
                  })),
                }}
                options={paceChartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
            )}
          </div>
        </div>

        {/* Conquête */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-mist text-sm">Taux de conquête</h3>
              <span className="text-xs text-mist/60 font-mono">{conqueteAverage}</span>
            </div>
          </div>
          <div className={`h-[200px] transition-opacity duration-300 ${isRefetchingConquete ? 'opacity-50' : 'opacity-100'}`}>
            {conqueteData && conqueteData.datasets?.length > 0 ? (
              <Bar
                data={{
                  labels: conqueteData.labels,
                  datasets: conqueteData.datasets.map((ds: ChartDataset) => ({
                    ...ds,
                    backgroundColor: 'rgba(61, 178, 224, 0.7)',
                    borderColor: '#3DB2E0',
                    borderWidth: 1,
                    borderRadius: 3,
                  })),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2', stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null } },
                  },
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
