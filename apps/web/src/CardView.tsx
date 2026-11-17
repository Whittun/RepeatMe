import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Pencil, Play, ExternalLink } from 'lucide-react';
import { api } from './api';
import { type Card, type Category, type Attempt, formatDate, categoryPath } from './types';
import { Status } from './Overview';
import s from './app.module.css';
export function Sources({ card }: { card: Card }) {
  return <div className={s.sources}>{card.sources.map((source, i) => /^(https?:\/\/|obsidian:\/\/)/i.test(source.url) && <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>{source.label || source.url}</a>)}</div>;
}
export function Material({ text }: { text: string }) { return <div className={s.markdown}><ReactMarkdown skipHtml components={{ a: props => <a {...props} target="_blank" rel="noopener noreferrer"/> }}>{text || '*Материал не добавлен. Можно проверить себя по источникам.*'}</ReactMarkdown></div>; }
export function CardView({ card, categories, onEdit, onReview }: { card: Card; categories: Category[]; onEdit: () => void; onReview: () => void }) {
  const [history, setHistory] = useState<Attempt[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { let alive = true; setHistory(null); setError(''); api<Attempt[]>(`cards/${card.id}/history`).then(v => { if (alive) setHistory(v); }).catch(e => { if (alive) setError(e.message); }); return () => { alive = false; }; }, [card.id, retry]);
  return <><div className={s.pageHeading}><div><p className={s.eyebrow}>{categoryPath(categories, card.categoryId)}</p><h1>{card.title}</h1></div><button onClick={onEdit}><Pencil size={16}/>Редактировать</button></div>
    <section className={s.reviewBanner}><div><Status card={card}/><p>Следующая проверка: {formatDate(card.nextReview)} {card.overdue && <b className={s.overdue}>· Просрочено</b>}</p></div><button className={s.primary} onClick={onReview}><Play size={16}/>Проверить себя</button></section>
    <section className={s.panel}><h2>Критерии проверки</h2><p className={s.prewrap}>{card.criteria || 'Критерии не добавлены. Попробуйте объяснить тему своими словами.'}</p><h3>Источники</h3>{card.sources.length ? <Sources card={card}/> : <p className={s.muted}>Источников пока нет</p>}</section>
    <section className={s.panel}><h2>Материал</h2><Material text={card.explanation}/></section>
    <section className={s.panel}><h2>История проверок</h2>{error ? <p className={s.error} role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Повторить</button></p> : !history ? <p>Загрузка…</p> : !history.length ? <p className={s.muted}>Первая проверка ещё впереди.</p> : history.map(a => <div className={s.historyRow} key={a.id}><span>{new Intl.DateTimeFormat('ru', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(new Date(a.createdAt))} МСК</span><strong className={a.remembered ? s.successText : s.overdue}>{a.remembered ? 'Помню' : 'Не помню'}</strong><small>Следующая: {formatDate(a.nextReview)}</small></div>)}</section>
  </>;
}
