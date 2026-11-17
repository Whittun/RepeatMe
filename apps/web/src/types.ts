export const labels = { new: 'Новая', forgotten: 'Забыта', weak: 'Слабо закреплена', learning: 'Закрепляется', stable: 'Устойчива' };
export type State = keyof typeof labels;
export const states = Object.keys(labels) as State[];
export interface Stats { total: number; checked: number; due: number; overdue: number; counts: Record<State, number> }
export interface Category { id: string; name: string; parentId: string | null; stats: Stats }
export interface Source { label: string; url: string }
export interface Card { id: string; title: string; categoryId: string | null; explanation: string; criteria: string; sources: Source[]; streak: number; state: State; due: boolean; overdue: boolean; nextReview: string | null }
export interface Attempt { id: string; remembered: boolean; createdAt: string; nextReview: string }
export interface Snapshot { today: string; categories: Category[]; cards: Card[]; stats: Stats; queue: string[] }
export const formatDate = (day: string | null) => day ? new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(`${day}T12:00:00Z`)) : 'Можно начать сейчас';
export function categoryPath(categories: Category[], id: string | null): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  while (id && !seen.has(id)) { seen.add(id); const c = categories.find(c => c.id === id); if (!c) break; parts.unshift(c.name); id = c.parentId; }
  return parts.join(' / ') || 'Без категории';
}
