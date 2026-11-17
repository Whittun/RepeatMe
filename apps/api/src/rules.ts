export const TIME_ZONE = 'Europe/Moscow';
export const INTERVALS = [1, 3, 7, 14, 30] as const;
export const STATES = ['new', 'forgotten', 'weak', 'learning', 'stable'] as const;
export type State = typeof STATES[number];
export interface ScheduledCard { id: string; categoryId: string | null; streak: number; lastResult: boolean | null; nextReview: string | null }
export function today(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function schedule(streak: number, remembered: boolean, day: string) {
  const nextStreak = remembered ? streak + 1 : 0;
  const interval = remembered ? INTERVALS[Math.min(nextStreak - 1, INTERVALS.length - 1)] : 1;
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + interval);
  return { streak: nextStreak, lastResult: remembered, nextReview: date.toISOString().slice(0, 10) };
}
export function state(card: ScheduledCard): State {
  if (card.lastResult === null) return 'new';
  if (!card.lastResult) return 'forgotten';
  return card.streak >= 3 ? 'stable' : card.streak === 2 ? 'learning' : 'weak';
}
export function decorate<T extends ScheduledCard>(card: T, day: string) {
  return { ...card, state: state(card), due: !card.nextReview || card.nextReview <= day, overdue: !!card.nextReview && card.nextReview < day };
}
export function branchIds(categories: { id: string; parentId: string | null }[], root: string): Set<string> {
  const ids = new Set([root]);
  const queue = [root];
  while (queue.length) {
    const parent = queue.pop();
    for (const c of categories) if (c.parentId === parent && !ids.has(c.id)) { ids.add(c.id); queue.push(c.id); }
  }
  return ids;
}
export function inScope<T extends ScheduledCard>(cards: T[], categories: { id: string; parentId: string | null }[], root?: string): T[] {
  if (!root) return cards;
  const ids = branchIds(categories, root);
  return cards.filter(c => c.categoryId !== null && ids.has(c.categoryId));
}
export function statistics(cards: ScheduledCard[], day: string) {
  const counts = Object.fromEntries(STATES.map(s => [s, 0])) as Record<State, number>;
  let due = 0, overdue = 0;
  for (const c of cards) { const d = decorate(c, day); counts[d.state]++; due += +d.due; overdue += +d.overdue; }
  return { total: cards.length, checked: cards.length - counts.new, due, overdue, counts };
}
export function reviewQueue<T extends ScheduledCard>(cards: T[], day: string) {
  const rank = (c: T) => c.lastResult === false ? 0 : c.lastResult === null ? 1 : 2;
  return cards.filter(c => decorate(c, day).due).sort((a, b) => rank(a) - rank(b) || (a.nextReview ?? '').localeCompare(b.nextReview ?? '') || a.id.localeCompare(b.id));
}
