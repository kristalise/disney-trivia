import type { VoteState } from '@/hooks/useFaqVotes';

interface FaqVoteButtonsProps {
  voteKey: string;
  votes: Record<string, VoteState>;
  onVote: (faqItemId: string, isHelpful: boolean) => void;
}

export default function FaqVoteButtons({ voteKey, votes, onVote }: FaqVoteButtonsProps) {
  const itemVotes = votes[voteKey];

  return (
    <div className="flex items-center gap-1 flex-shrink-0 ml-3">
      <button
        onClick={() => onVote(voteKey, true)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          itemVotes?.user_vote === true
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
        }`}
        title="Helpful"
      >
        <span>👍</span>
        {(itemVotes?.up ?? 0) > 0 && <span>{itemVotes?.up}</span>}
      </button>
      <button
        onClick={() => onVote(voteKey, false)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          itemVotes?.user_vote === false
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        title="Not helpful"
      >
        <span>👎</span>
        {(itemVotes?.down ?? 0) > 0 && <span>{itemVotes?.down}</span>}
      </button>
    </div>
  );
}
