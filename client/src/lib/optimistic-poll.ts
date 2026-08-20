import type { QuestionItem } from "@/types";

export function applyOptimisticPollVote(
  item: QuestionItem,
  optionIndex: number,
): QuestionItem {
  const question = item.question;
  if (question.postType !== "poll") return item;

  const oldUserVote = question.userPollVote ?? null;
  const counts = new Map<number, number>(
    (question.pollVotes ?? []).map((vote) => [vote.optionIndex, vote.count]),
  );

  const adjust = (index: number, delta: number) => {
    counts.set(index, Math.max(0, (counts.get(index) ?? 0) + delta));
  };

  if (oldUserVote === optionIndex) {
    adjust(optionIndex, -1);
  } else {
    if (oldUserVote !== null) adjust(oldUserVote, -1);
    adjust(optionIndex, 1);
  }

  const pollVotes = Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .map(([index, count]) => ({ optionIndex: index, count }))
    .sort((a, b) => a.optionIndex - b.optionIndex);

  return {
    ...item,
    question: {
      ...question,
      pollVotes,
      userPollVote: oldUserVote === optionIndex ? null : optionIndex,
    },
  };
}
