import { useRef, useState } from 'react';
import { ArrowRight, Check, Eye, X, CheckCheck } from './PixelIcons';
import { api } from './api';
import { type Card, type Attempt, formatDate } from './types';
import { Material, Sources } from './CardView';
import s from './app.module.css';
export function Review({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [saved, setSaved] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  // Preserve payload on retry; response loss must not produce a second history entry.
  const pending = useRef<{ requestId: string; remembered: boolean } | null>(null);
  const sending = useRef(false);
  const card = cards[index];
  async function answer(remembered: boolean) {
    if (sending.current || saved) return;
    sending.current = true; setBusy(true); setError('');
    pending.current ??= { requestId: crypto.randomUUID(), remembered };
    try {
      const attempt = await api<Attempt>(`cards/${card.id}/reviews`, 'POST', pending.current);
      setSaved(attempt); setResults(old => [...old, attempt.remembered]);
    } catch (e) { setError((e as Error).message); }
    finally { sending.current = false; setBusy(false); }
  }
  function next() { pending.current = null; setSaved(null); setShown(false); if (index + 1 >= cards.length) setFinished(true); else setIndex(index + 1); }
  if (finished || !card) return <section className={s.sessionSummary}><span className={s.emptyIcon}><CheckCheck size={36}/></span><p className={s.eyebrow}>ПОВТОРЕНИЕ ЗАВЕРШЕНО</p><h1>Ещё один шаг к прочным знаниям</h1><p>Проверено карточек: {results.length}</p><div className={s.resultCounts}><span>Помню <strong>{results.filter(Boolean).length}</strong></span><span>Не помню <strong>{results.filter(v => !v).length}</strong></span></div><p className={s.muted}>Все результаты сохранены. Возвращайтесь к следующей проверке.</p><button className={s.primary} onClick={onExit}>Вернуться к карте<ArrowRight size={17}/></button></section>;
  return <><div className={s.sectionHeading}><p className={s.eyebrow}>ПОВТОРЕНИЕ · {index + 1} ИЗ {cards.length}</p><button disabled={busy} onClick={() => setFinished(true)}>Завершить занятие</button></div><div className={s.sessionProgress}><span style={{ width: `${results.length / cards.length * 100}%` }}/></div>
    <section className={s.reviewCard}><p className={s.eyebrow}>ВСПОМНИТЕ БЕЗ ПОДСКАЗКИ</p><h1>{card.title}</h1><h3>Критерии проверки</h3><p className={s.prewrap}>{card.criteria || 'Объясните тему своими словами и проверьте себя по источникам.'}</p><Sources card={card}/>
    {shown ? <Material text={card.explanation}/> : <button className={s.showMaterial} onClick={() => setShown(true)}><Eye size={18}/>Показать материал</button>}
    <p className={s.footnote}>Оцените результат самостоятельно после проверки.</p>
    {error && <p className={s.error} role="alert">{error} Результат не подтверждён. Повторите отправку той же оценки.</p>}
    {saved ? <div className={s.savedResult}><p><Check size={19}/>Сохранено: {saved.remembered ? 'Помню' : 'Не помню'}. Следующая проверка: {formatDate(saved.nextReview)}</p><button className={s.primary} onClick={next}>{index + 1 === cards.length ? 'Показать итог' : 'Следующая карточка'}<ArrowRight size={17}/></button></div> : <div className={s.answerButtons}><button disabled={busy || !!pending.current && pending.current.remembered} onClick={() => answer(false)}><X size={20}/>{busy && pending.current?.remembered === false ? 'Сохранение…' : 'Не помню'}</button><button disabled={busy || !!pending.current && !pending.current.remembered} onClick={() => answer(true)}><Check size={20}/>{busy && pending.current?.remembered ? 'Сохранение…' : 'Помню'}</button></div>}
    </section></>;
}
