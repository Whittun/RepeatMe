import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Plus, Trash2 } from './PixelIcons';
import { api } from './api';
import type { Category, Card, Source } from './types';
import { categoryPath } from './types';
import s from './app.module.css';
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={s.modal} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}><div className={s.modalHeader}><h2>{title}</h2><button onClick={onClose} aria-label="Закрыть"><X size={20}/></button></div>{children}</dialog>;
}
export function Editor({ type, item, categories, parentId, onClose, onSaved }: { type: 'card' | 'category'; item?: Card | Category; categories: Category[]; parentId: string | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const card = type === 'card' ? item as Card | undefined : undefined;
  const category = type === 'category' ? item as Category | undefined : undefined;
  const [name, setName] = useState(card?.title ?? category?.name ?? '');
  const [parent, setParent] = useState(card?.categoryId ?? category?.parentId ?? parentId ?? '');
  const [criteria, setCriteria] = useState(card?.criteria ?? '');
  const [explanation, setExplanation] = useState(card?.explanation ?? '');
  const [sources, setSources] = useState<Source[]>(card?.sources ?? []);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const blocked = (c: Category) => {
    let current: Category | undefined = c;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) { if (current.id === category?.id) return true; visited.add(current.id); current = categories.find(x => x.id === current!.parentId); }
    return false;
  };
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api(`${type === 'card' ? 'cards' : 'categories'}${item ? `/${item.id}` : ''}`, item ? 'PUT' : 'POST', type === 'card' ? { title: name, categoryId: parent || null, criteria, explanation, sources } : { name, parentId: parent || null });
      await onSaved(); onClose();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await api(`${type === 'card' ? 'cards' : 'categories'}/${item!.id}`, 'DELETE'); await onSaved(); onClose(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={item ? `Редактирование ${type === 'card' ? 'карточки' : 'категории'}` : `Новая ${type === 'card' ? 'карточка' : 'категория'}`} onClose={() => { if (!busy) onClose(); }}><form onSubmit={save} className={s.form}>
    <label>Название <span>*</span><input autoFocus required maxLength={200} value={name} onChange={e => setName(e.target.value)} placeholder={type === 'card' ? 'Что вы хотите запомнить?' : 'Например, Разработка'}/></label>
    <label>{type === 'card' ? 'Категория' : 'Родительская категория'}<select value={parent} onChange={e => setParent(e.target.value)}><option value="">Корень карты</option>{categories.filter(c => !blocked(c)).map(c => <option key={c.id} value={c.id}>{categoryPath(categories, c.id)}</option>)}</select></label>
    {type === 'card' && <><label>Критерии проверки<textarea value={criteria} maxLength={20000} onChange={e => setCriteria(e.target.value)} placeholder="Какие вопросы нужно объяснить? Какую задачу решить?" rows={3}/></label>
    <div className={s.sectionHeading}><h3>Источники</h3><button type="button" className={s.textButton} disabled={sources.length >= 50} onClick={() => setSources([...sources, { label: '', url: '' }])}><Plus size={15}/>Добавить</button></div>
    {sources.map((source, i) => <div className={s.sourceFields} key={i}><input aria-label={`Подпись источника ${i + 1}`} placeholder="Подпись" maxLength={200} value={source.label} onChange={e => setSources(sources.map((v, n) => n === i ? { ...v, label: e.target.value } : v))}/><input aria-label={`Ссылка источника ${i + 1}`} required placeholder="https://… или obsidian://…" value={source.url} onChange={e => setSources(sources.map((v, n) => n === i ? { ...v, url: e.target.value } : v))}/><button type="button" aria-label="Удалить источник" onClick={() => setSources(sources.filter((_, n) => n !== i))}><X size={16}/></button></div>)}
    <div className={s.sectionHeading}><h3>Материал <small>Markdown · необязательно</small></h3><button type="button" className={s.textButton} onClick={() => setPreview(!preview)}>{preview ? 'Редактировать' : 'Предпросмотр'}</button></div>
    {preview ? <div className={s.markdown}><ReactMarkdown skipHtml>{explanation || '*Пока нет материала*'}</ReactMarkdown></div> : <textarea aria-label="Материал Markdown" rows={6} value={explanation} maxLength={100000} onChange={e => setExplanation(e.target.value)} placeholder="Заметки, примеры и код — если они нужны"/>}</>}
    {error && <p role="alert" className={s.error}>{error}</p>}
    {confirmDelete && <div className={s.error}><p>{type === 'card' ? 'Удалить карточку вместе со всей историей проверок?' : 'Удалить пустую категорию?'}</p><button type="button" disabled={busy} onClick={remove}>Да, удалить</button><button type="button" onClick={() => setConfirmDelete(false)}>Отмена</button></div>}
    <div className={s.formFooter}>{item && <button type="button" className={s.dangerButton} disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={16}/>Удалить</button>}<div className={s.actions}><button type="button" disabled={busy} onClick={onClose}>Отмена</button><button className={s.primary} disabled={busy || !name.trim()}>{busy ? 'Сохранение…' : 'Сохранить'}</button></div></div>
  </form></Modal>;
}
