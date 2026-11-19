import { useRef, useState } from 'react';
import { api } from './api';
import { Modal } from './Forms';
import { type Category, categoryPath } from './types';
import { folderVault, zipVault, isWithin, type ImportVault } from './import-vault';
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, Folder } from './PixelIcons';
import s from './app.module.css';

interface Result { categoriesCreated: number; cardsCreated: number; cardsSkipped: number }
function Choice({ checked, mixed, onChange, label }: { checked: boolean; mixed?: boolean; onChange: () => void; label: string }) {
  return <input type="checkbox" aria-label={label} checked={checked} ref={el => { if (el) el.indeterminate = !!mixed; }} onChange={onChange}/>;
}
export function ImportObsidian({ categories, initialParent, onClose, onImported }: { categories: Category[]; initialParent: string | null; onClose: () => void; onImported: () => Promise<void> }) {
  const folderInput = useRef<HTMLInputElement>(null), zipInput = useRef<HTMLInputElement>(null);
  const [vault, setVault] = useState<ImportVault | null>(null);
  const [name, setName] = useState(''), [prefix, setPrefix] = useState('');
  const [base, setBase] = useState(''), [selected, setSelected] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [parent, setParent] = useState(initialParent ?? '');
  const [includeText, setIncludeText] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const guard = useRef(false);
  function accept(v: ImportVault) {
    if (!v.notes.length && !v.folders.length) throw new Error('В источнике нет Markdown-заметок или категорий.');
    setVault(v); setName(v.name); setPrefix(''); setBase(''); setSelected(new Set()); setClosed(new Set(v.folders)); setIncludeText(false); setError(''); setResult(null);
  }
  async function chooseZip(file?: File) {
    if (!file) return; setBusy(true); setError(''); setVault(null); setSelected(new Set());
    try { if (file.size > 50 * 1024 * 1024) throw new Error('ZIP-архив должен быть не больше 50 МБ.'); accept(zipVault(new Uint8Array(await file.arrayBuffer()), file.name)); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const visible = vault ? [...vault.folders, ...vault.notes.map(n => n.path)].filter(p => isWithin(p, base) && p !== base) : [];
  function toggle(paths: string[]) {
    setSelected(old => { const next = new Set(old), remove = paths.every(p => next.has(p)); for (const p of paths) { if (remove) next.delete(p); else next.add(p); } return next; });
  }
  function focus(folder: string) { setBase(folder); setSelected(new Set()); setClosed(old => { const next = new Set(old); next.delete(folder); return next; }); }
  function tree(folder: string): React.ReactNode {
    const children = vault!.folders.filter(p => p.slice(0, p.lastIndexOf('/')) === folder && p !== folder);
    const notes = vault!.notes.filter(n => n.path.slice(0, n.path.lastIndexOf('/')) === folder);
    // Root-level paths have no slash; slice(0, -1) is not their parent.
    const childFolders = folder ? children : vault!.folders.filter(p => !p.includes('/'));
    const childNotes = folder ? notes : vault!.notes.filter(n => !n.path.includes('/'));
    return <>{childFolders.map(path => {
      const paths = [path, ...visible.filter(p => p !== path && isWithin(p, path))];
      const count = paths.filter(p => selected.has(p)).length, expanded = !closed.has(path);
      return <div key={path}><div className={s.importRow}>
        <button type="button" className={s.importExpand} aria-label={`${expanded ? 'Свернуть' : 'Раскрыть'} ${path}`} aria-expanded={expanded} onClick={() => setClosed(old => { const next = new Set(old); if (next.has(path)) next.delete(path); else next.add(path); return next; })}>{expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</button>
        <Choice label={`Выбрать категорию ${path}`} checked={count === paths.length} mixed={count > 0 && count < paths.length} onChange={() => toggle(paths)}/><Folder size={16}/><span>{path.split('/').at(-1)}</span>
        <button type="button" className={s.textButton} title="Показать эту ветку отдельно" onClick={() => focus(path)}>Только эта ветка<ArrowRight size={12}/></button>
      </div>{expanded && <div className={s.importChildren}>{tree(path)}</div>}</div>;
    })}{childNotes.map(note => <label className={`${s.importRow} ${s.importNote}`} key={note.path}><Choice label={`Выбрать заметку ${note.path}`} checked={selected.has(note.path)} onChange={() => toggle([note.path])}/><BookOpen size={14}/><span>{note.path.split('/').at(-1)!.slice(0, -3)}</span></label>)}</>;
  }
  async function submit() {
    if (!vault || guard.current) return; guard.current = true; setBusy(true); setError('');
    try {
      const chosen = vault.notes.filter(n => selected.has(n.path)), contents = includeText ? await vault.readContents(new Set(chosen.map(n => n.path))) : new Map<string, string>();
      const data = await api<Result>('imports/obsidian', 'POST', { vaultName: name, vaultPrefix: prefix, basePath: base, parentId: parent || null,
        folders: vault.folders.filter(p => selected.has(p)), notes: chosen.map(n => ({ path: n.path, ...(includeText ? { content: contents.get(n.path) ?? '' } : {}) })) });
      setResult(data); await onImported();
    } catch (e) { setError((e as Error).message); } finally { guard.current = false; setBusy(false); }
  }
  const noteCount = vault?.notes.filter(n => selected.has(n.path)).length ?? 0;
  return <Modal title="Импорт из Obsidian" onClose={() => { if (!busy) onClose(); }}><div className={s.importer}>
    {result ? <><p className={s.importSuccess} role="status">Импорт завершён</p><p>Категорий создано: <b>{result.categoriesCreated}</b><br/>Карточек создано: <b>{result.cardsCreated}</b><br/>Уже существовали: <b>{result.cardsSkipped}</b></p><button className={s.primary} onClick={onClose}>Готово</button></> : <>
    <p className={s.muted}>Выберите папку Vault или ZIP с Markdown-заметками, затем отметьте то, что хотите добавить.</p>
    <div className={s.importPickers}><button disabled={busy} onClick={() => folderInput.current?.click()}><Folder size={17}/>Выбрать папку</button><button disabled={busy} onClick={() => zipInput.current?.click()}>Открыть ZIP</button></div>
    <input hidden type="file" multiple ref={folderInput} {...{ webkitdirectory: '', directory: '' }} onChange={e => { try { if (e.target.files?.length) { setVault(null); setSelected(new Set()); accept(folderVault(Array.from(e.target.files))); } } catch (err) { setError((err as Error).message); } e.target.value = ''; }}/>
    <input hidden type="file" accept=".zip,application/zip" ref={zipInput} onChange={e => { void chooseZip(e.target.files?.[0]); e.target.value = ''; }}/>
    {vault && <><fieldset className={s.importOptions} disabled={busy}><label>Имя Vault в Obsidian<input value={name} maxLength={200} onChange={e => setName(e.target.value)}/></label><label>Добавить в категорию<select value={parent} onChange={e => setParent(e.target.value)}><option value="">Корень карты</option>{categories.map(c => <option key={c.id} value={c.id}>{categoryPath(categories, c.id)}</option>)}</select></label>
    <label className={s.importFullWidth}>Путь загруженной папки внутри Vault <small>Оставьте пустым, если выбрали весь Vault</small><input placeholder="Например: Развитие/Разработка" value={prefix} maxLength={2000} onChange={e => setPrefix(e.target.value)}/></label></fieldset>
    <div className={s.importToolbar}><span>{base || vault.name}</span>{base && <button disabled={busy} className={s.textButton} onClick={() => focus(base.includes('/') ? base.slice(0, base.lastIndexOf('/')) : '')}>На уровень выше</button>}<button disabled={busy} className={s.textButton} onClick={() => toggle(visible)}>{visible.length && visible.every(p => selected.has(p)) ? 'Снять всё' : 'Выбрать всё'}</button></div>
    <fieldset className={s.importTree} disabled={busy}>{tree(base)}</fieldset>
    <label className={s.importCheckbox}><input type="checkbox" checked={includeText} disabled={busy} onChange={e => setIncludeText(e.target.checked)}/>Также импортировать текст выбранных заметок</label>
    <p className={s.importHint}>По умолчанию добавляются названия, структура и ссылки. Существующие карточки, вопросы и история сохраняются.</p>
    <div className={s.importFooter}><span>{noteCount} заметок · {vault.folders.filter(p => selected.has(p)).length} категорий</span><button className={s.primary} disabled={busy || !selected.size || !name.trim()} onClick={() => void submit()}>{busy ? 'Импорт…' : 'Импортировать выбранное'}</button></div></>}
    </>}{error && <p className={s.error} role="alert">{error}</p>}
  </div></Modal>;
}
