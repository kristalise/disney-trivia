import { useState, useEffect, useCallback } from 'react';

export interface VoteState {
  up: number;
  down: number;
  user_vote: boolean | null;
}

export function useFaqVotes(itemIds: string[]) {
  const [votes, setVotes] = useState<Record<string, VoteState>>({});

  useEffect(() => {
    if (itemIds.length === 0) return;
    fetch(`/api/faq-votes?items=${itemIds.join(',')}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.votes) setVotes(data.votes); })
      .catch(() => {});
  }, [itemIds]);

  const handleVote = useCallback(async (faqItemId: string, isHelpful: boolean) => {
    const prev = votes[faqItemId] || { up: 0, down: 0, user_vote: null };

    let optimistic: VoteState;
    if (prev.user_vote === isHelpful) {
      optimistic = {
        up: prev.up - (isHelpful ? 1 : 0),
        down: prev.down - (!isHelpful ? 1 : 0),
        user_vote: null,
      };
    } else if (prev.user_vote === null) {
      optimistic = {
        up: prev.up + (isHelpful ? 1 : 0),
        down: prev.down + (!isHelpful ? 1 : 0),
        user_vote: isHelpful,
      };
    } else {
      optimistic = {
        up: prev.up + (isHelpful ? 1 : -1),
        down: prev.down + (!isHelpful ? 1 : -1),
        user_vote: isHelpful,
      };
    }

    setVotes(v => ({ ...v, [faqItemId]: optimistic }));

    try {
      const res = await fetch('/api/faq-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq_item_id: faqItemId, is_helpful: isHelpful }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVotes(v => ({ ...v, [faqItemId]: prev }));
    }
  }, [votes]);

  return { votes, handleVote };
}
