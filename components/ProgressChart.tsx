'use client';

interface ProgressChartProps {
  data: { label: string; value: number; color: string }[];
  title?: string;
}

export default function ProgressChart({ data, title }: ProgressChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
      {title && (
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
              <span className="font-medium text-slate-900 dark:text-white">{item.value}%</span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
