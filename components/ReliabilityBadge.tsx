'use client';

interface ReliabilityBadgeProps {
  score: number;
  totalRatings: number;
  isUserContributed?: boolean;
  cruiseName?: string;
  showDetails?: boolean;
}

export default function ReliabilityBadge({
  score,
  totalRatings,
  isUserContributed,
  cruiseName,
  showDetails = false,
}: ReliabilityBadgeProps) {
  const percentage = Math.round(score * 100);

  const getColor = () => {
    if (totalRatings < 3) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    if (percentage >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const getIcon = () => {
    if (totalRatings < 3) return '📊';
    if (percentage >= 80) return '✅';
    if (percentage >= 60) return '⚠️';
    return '❓';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* User Contributed Badge */}
      {isUserContributed && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <span>👤</span>
          <span>Community</span>
        </span>
      )}

      {/* Cruise Name Badge */}
      {cruiseName && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <span>🚢</span>
          <span>{cruiseName}</span>
        </span>
      )}

      {/* Reliability Badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
        <span>{getIcon()}</span>
        {totalRatings < 3 ? (
          <span>New</span>
        ) : (
          <span>{percentage}% Reliable</span>
        )}
      </span>

      {/* Details */}
      {showDetails && totalRatings > 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}
