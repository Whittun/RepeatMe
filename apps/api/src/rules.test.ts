import { describe, it, expect } from 'vitest';
import { today, schedule, state, statistics, inScope, branchIds, reviewQueue, decorate } from './rules';
const card = (id: string, categoryId: string | null = null, lastResult: boolean | null = null, streak = 0, nextReview: string | null = null) => ({ id, categoryId, lastResult, streak, nextReview });
describe('правила повторения', () => {
  it('считает календарный день Москвы у границы UTC', () => {
    expect(today(new Date('2026-11-17T20:59:59Z'))).toBe('2026-11-17');
    expect(today(new Date('2026-11-17T21:00:00Z'))).toBe('2026-11-18');
  });
  it('назначает 1, 3, 7, 14, 30, 30 дней и сбрасывает серию', () => {
    const expected = ['2026-02-01', '2026-02-03', '2026-02-07', '2026-02-14', '2026-03-02', '2026-03-02'];
    expected.forEach((day, streak) => expect(schedule(streak, true, '2026-01-31').nextReview).toBe(day));
    const failed = schedule(5, false, '2028-02-28');
    expect(failed).toEqual({ streak: 0, lastResult: false, nextReview: '2028-02-29' });
    expect(schedule(failed.streak, true, failed.nextReview).nextReview).toBe('2028-03-01');
  });
  it('просрочка независима от закреплённости', () => {
    expect(decorate(card('a', null, true, 3, '2026-01-01'), '2026-11-17')).toMatchObject({ state: 'stable', due: true, overdue: true });
    expect(decorate(card('a', null, true, 1, '2026-11-17'), '2026-11-17').overdue).toBe(false);
  });
  it('считает вложенные карточки один раз, включая новые и корень', () => {
    const cats = [{ id: 'a', parentId: null }, { id: 'b', parentId: 'a' }, { id: 'c', parentId: 'b' }];
    const cards = [card('1', 'a'), card('2', 'c', true, 3, '2026-12-01'), card('3', null)];
    expect(statistics(inScope(cards, cats, 'a'), '2026-11-17')).toMatchObject({ total: 2, checked: 1, due: 1, counts: { new: 1, stable: 1 } });
    expect(statistics(inScope(cards, cats), '2026-11-17').total).toBe(3);
    expect(branchIds(cats, 'a').has('c')).toBe(true);
  });
  it('очередь: забытые, новые, остальные; будущие исключены', () => {
    const cards = [card('stable', null, true, 3, '2026-11-01'), card('new'), card('forgotten', null, false, 0, '2026-11-17'), card('future', null, false, 0, '2026-11-18')];
    expect(reviewQueue(cards, '2026-11-17').map(c => c.id)).toEqual(['forgotten', 'new', 'stable']);
    expect(state(card('new'))).toBe('new');
  });
});
