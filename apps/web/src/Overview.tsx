import { ArrowRight, Folder, Plus, Play, Clock3, Layers, CheckCheck, Pencil, ListOrdered } from './PixelIcons';
import { PixelScene } from './PixelScene';
import type { Stats, Snapshot, Card } from './types';
import { labels, states } from './types';
import s from './app.module.css';
export function Distribution({ stats, compact = false }: { stats: Stats; compact?: boolean }) {
  const text = states.map(k => `${labels[k]}: ${stats.counts[k]}`).join(', ');
  return <div className={`${s.distribution} ${compact ? s.compact : ''}`} role="img" aria-label={text}>{states.map(k => stats.counts[k] > 0 && <span key={k} className={s[k]} style={{ flex: stats.counts[k] }} title={`${labels[k]}: ${stats.counts[k]}`}>{!compact && stats.counts[k]}</span>)}</div>;
}
export function Status({ card }: { card: Card }) { return <span className={s.status}><i className={s[card.state]}/>{labels[card.state]}</span>; }
interface Props { data: Snapshot; categoryId: string | null; onCategory: (id: string) => void; onCard: (c: Card) => void; onCreate: (t: 'card' | 'category') => void; onEdit: () => void; onReview: () => void; onQueue: () => void }
export function Overview({ data, categoryId, onCategory, onCard, onCreate, onEdit, onReview, onQueue }: Props) {
  const { stats } = data;
  const category = data.categories.find(c => c.id === categoryId);
  const children = data.categories.filter(c => c.parentId === categoryId);
  const cards = data.cards.filter(c => c.categoryId === categoryId);
  return <>
    <div className={s.pageHeading}><div><p className={s.eyebrow}>ВАША КАРТА ЗНАНИЙ</p><h1>{category?.name ?? 'Общий обзор'}</h1></div><div className={s.actions}>{category && <button onClick={onEdit} aria-label="Редактировать категорию"><Pencil size={17}/></button>}<button className={s.primary} onClick={() => onCreate('card')}><Plus size={17}/>Новая карточка</button></div></div>
    <section className={s.reviewBanner}><div className={s.heroContent}><span className={s.heroLabel}><Clock3 size={14}/>{stats.due ? `${stats.due} КАРТОЧЕК В ОЧЕРЕДИ` : 'НОВАЯ ТЕМА — НОВОЕ ПРИКЛЮЧЕНИЕ'}</span><h2>{stats.due ? 'Твой следующий ход —\nвспомнить важное.' : 'Большие знания\nначинаются с карточки.'}</h2><p>{stats.due ? 'Вернись к изученному. Проверь себя. Сохрани знания надолго.' : 'Собери свою библиотеку тем и возвращайся к ним в нужный момент.'}</p><button className={s.primary} onClick={stats.due ? onReview : () => onCreate('card')}><Play size={16}/>{stats.due ? 'Начать повторение' : 'Создать первую карточку'}<ArrowRight size={17}/></button></div><PixelScene className={s.heroArt}/><span className={s.heroCaption} aria-hidden="true">ПО ОДНОЙ КАРТОЧКЕ ЗА РАЗ</span></section>
    <div className={s.metrics}>
      <div><span>Всего карточек <Layers size={17}/></span><strong>{stats.total}</strong><small>в {category ? 'этой ветке' : 'вашей карте знаний'}</small></div>
      <div><span>Проверено <CheckCheck size={18}/></span><strong>{stats.checked}<em> / {stats.total}</em></strong><small>Охват самостоятельными проверками</small></div>
      <button onClick={onQueue}><span>Пора повторить <Clock3 size={17}/></span><strong>{stats.due}</strong><small>{stats.overdue ? <b>{stats.overdue} просрочено</b> : 'Просроченных нет'}</small></button>
    </div>
    <section className={s.panel}><div className={s.sectionHeading}><div><h2>Как закрепляются знания</h2><p>Распределение карточек по результатам ваших проверок</p></div><span className={s.pill}>{stats.total} карточек</span></div>
      <Distribution stats={stats}/>{!stats.total && <p className={s.emptyDistribution}>Добавьте карточку, чтобы начать свою историю проверок</p>}<div className={s.legend}>{states.map(k => <div key={k}><i className={s[k]}/><span>{labels[k]}</span><strong>{stats.counts[k]}</strong></div>)}</div>
      <p className={s.footnote}>Это история ваших проверок, а не оценка вероятности вспомнить материал.</p>
    </section>
    <div className={s.sectionHeading}><h2>{category ? 'Внутри категории' : 'Ваши темы'}</h2><button className={s.textButton} onClick={() => onCreate('category')}><Plus size={16}/>Категория</button></div>
    {!children.length && !cards.length && <section className={s.empty}><span className={s.emptyIcon}><Layers size={32}/></span><div><p className={s.eyebrow}>В БИБЛИОТЕКЕ ПОКА ПУСТО</p><h2>Здесь начинается ваша история</h2><p>Добавьте тему, которую хочется запомнить.<br/>Для первой карточки достаточно названия.</p></div><div className={s.actions}><button className={s.primary} onClick={() => onCreate('card')}><Plus size={17}/>Создать карточку</button><button onClick={() => onCreate('category')}>Создать категорию</button></div></section>}
    <div className={s.categoryGrid}>{children.map(c => <button key={c.id} className={s.categoryTile} onClick={() => onCategory(c.id)}><div><span className={s.folderIcon}><Folder size={20}/></span><ArrowRight size={16}/></div><h3>{c.name}</h3><p>{c.stats.total} карточек <span>·</span> {c.stats.due} к повторению</p><Distribution stats={c.stats} compact/><div className={s.tileLegend}>{states.filter(k => c.stats.counts[k]).map(k => <span key={k} title={labels[k]}><i className={s[k]}/>{labels[k]}: {c.stats.counts[k]}</span>)}</div></button>)}</div>
    {!!cards.length && <section className={s.cardList}><div className={s.tableHead}><span>КАРТОЧКА</span><span>СОСТОЯНИЕ</span><span>ПОВТОРЕНИЕ</span></div>{cards.map(c => <button key={c.id} onClick={() => onCard(c)}><strong>{c.title}</strong><Status card={c}/><span className={c.overdue ? s.overdue : s.muted}>{c.overdue ? 'Просрочено' : c.due ? 'Можно повторить' : c.nextReview}</span><ArrowRight size={16}/></button>)}</section>}
    <button className={s.queueLink} onClick={onQueue}><ListOrdered size={17}/>Посмотреть очередь повторения<ArrowRight size={15}/></button>
  </>;
}
