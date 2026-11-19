import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Folder, LayoutDashboard, Plus, Layers } from './PixelIcons';
import type { Snapshot, Card, Category } from './types';
import { labels } from './types';
import { Distribution } from './Overview';
import { ObsidianIcon } from './ObsidianIcon';
import s from './app.module.css';
interface Props { data: Snapshot; categoryId: string | null; cardId: string | null; onCategory: (id: string | null) => void; onCard: (card: Card) => void; onCreate: (type: 'card' | 'category') => void; onImport: () => void; importDisabled?: boolean }
export function Sidebar({ data, categoryId, cardId, onCategory, onCard, onCreate, onImport, importDisabled }: Props) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setClosed(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  function cardRow(card: Card) {
    return <button key={card.id} className={`${s.treeCard} ${cardId === card.id ? s.selected : ''}`} onClick={() => onCard(card)} title={`${card.title} · ${labels[card.state]}`}><i className={s[card.state]}/><span>{card.title}</span></button>;
  }
  function branch(category: Category) {
    const expanded = !closed.has(category.id);
    return <div key={category.id} className={s.branch}>
      <div className={`${s.treeCategory} ${categoryId === category.id && !cardId ? s.selected : ''}`}>
        <button onClick={() => toggle(category.id)} aria-label={`${expanded ? 'Свернуть' : 'Раскрыть'} ${category.name}`} aria-expanded={expanded}>{expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button>
        <button onClick={() => onCategory(category.id)}><Folder size={15}/><span>{category.name}</span><small title="Карточек к повторению">{category.stats.due || ''}</small></button>
      </div>
      <div className={s.treeDistribution} title={`${category.stats.total} карточек; к повторению: ${category.stats.due}`}><Distribution stats={category.stats} compact/></div>
      {expanded && <div className={s.children}>{data.categories.filter(c => c.parentId === category.id).map(branch)}{data.cards.filter(c => c.categoryId === category.id).map(cardRow)}</div>}
    </div>;
  }
  return <aside className={s.sidebar}>
    <a className={s.brand} href="#" onClick={e => { e.preventDefault(); onCategory(null); }}><span className={s.brandIcon}><BookOpen size={25}/></span>RepeatMe<span className={s.beta}>BETA</span></a>
    <p className={s.tagline}>СОХРАНИ. ВСПОМНИ. ПОВТОРИ.</p>
    <div className={s.libraryBadge}><span className={s.libraryAvatar}><Layers size={24}/></span><div><strong>Личная библиотека</strong><span>{data.cards.length} карточек в коллекции</span></div></div>
    <button className={`${s.overviewLink} ${!categoryId && !cardId ? s.selected : ''}`} onClick={() => onCategory(null)}><LayoutDashboard size={18}/>Общий обзор</button>
    <div className={s.sidebarTitle}>МОЯ КАРТА <button aria-label="Добавить категорию" onClick={() => onCreate('category')}><Plus size={17}/></button></div>
    <nav aria-label="Карта знаний" className={s.tree}>{data.categories.filter(c => !c.parentId).map(branch)}{data.cards.filter(c => !c.categoryId).map(cardRow)}{!data.cards.length && !data.categories.length && <p className={s.muted}>Здесь появятся ваши темы</p>}</nav>
    <button className={s.addCard} onClick={() => onCreate('card')}><Plus size={18}/>Добавить карточку</button>
    <button className={s.importButton} onClick={onImport} disabled={importDisabled}><ObsidianIcon/>Импорт из Obsidian</button>
    <div className={s.sidebarFoot}><BookOpen size={22}/><div>НЕ ДАЙ ЗНАНИЯМ ИСЧЕЗНУТЬ</div></div>
  </aside>;
}
