import type { TrafficLight } from '@/lib/stateroom-types';
import { TRAFFIC_LIGHT_CLASSES, TRAFFIC_LIGHT_LABELS } from '@/lib/stateroom-scoring';

export default function ScoreBadge({ trafficLight }: { trafficLight: TrafficLight }) {
  const cls = TRAFFIC_LIGHT_CLASSES[trafficLight];
  const label = TRAFFIC_LIGHT_LABELS[trafficLight];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cls.bg} ${cls.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${trafficLight === 'green' ? 'bg-green-500' : trafficLight === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}
