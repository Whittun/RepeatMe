import { unzipSync } from 'fflate';

export interface VaultNote { path: string; size: number }
export interface ImportVault {
  name: string;
  folders: string[];
  notes: VaultNote[];
  readContents: (paths: Set<string>) => Promise<Map<string, string>>;
}
export function cleanPath(raw: string): string | null {
  const path = raw.replaceAll('\\', '/').replace(/\/$/, '');
  if (!path || /^[\/]|^[a-z]:|[\x00-\x1f]/i.test(path)) return null;
  const parts = path.split('/');
  if (parts.length > 32 || parts.some(p => !p || p.startsWith('.') || p === '__MACOSX' || p.length > 200)) return null;
  return path;
}
export function isWithin(path: string, folder: string) { return !folder || path === folder || path.startsWith(folder + '/'); }
function foldersFor(notes: VaultNote[], explicit: string[] = []) {
  const dirs = new Set(explicit.filter(p => cleanPath(p)));
  for (const note of notes) {
    const parts = note.path.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
  }
  return [...dirs].sort((a, b) => a.localeCompare(b, 'ru'));
}
function validateNotes(notes: VaultNote[]) {
  if (notes.length > 1000) throw new Error('Выберите папку или архив, содержащий не более 1000 Markdown-заметок.');
  if (new Set(notes.map(n => n.path)).size !== notes.length) throw new Error('В источнике повторяются пути заметок.');
}
function decode(bytes: Uint8Array) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (text.length > 100000) throw new Error('Одна заметка должна содержать не более 100 000 символов.');
  return text;
}
function checkContentSize(notes: VaultNote[]) {
  if (notes.some(n => n.size > 400000) || notes.reduce((n, note) => n + note.size, 0) > 1000000) {
    throw new Error('Для импорта текста выберите до 1 МБ данных; крупные заметки можно импортировать только по названиям.');
  }
}
export function folderVault(files: File[]): ImportVault {
  const first = files.find(f => f.webkitRelativePath)?.webkitRelativePath;
  const name = first?.split('/')[0] || 'Obsidian Vault';
  const byPath = new Map<string, File>();
  for (const file of files) {
    const raw = file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name;
    const path = cleanPath(raw);
    if (path && /\.md$/i.test(path)) byPath.set(path, file);
  }
  const notes = [...byPath].map(([path, file]) => ({ path, size: file.size }));
  validateNotes(notes);
  return { name, notes, folders: foldersFor(notes), readContents: async selected => {
    const chosen = notes.filter(n => selected.has(n.path)); checkContentSize(chosen);
    return new Map(await Promise.all(chosen.map(async n => [n.path, decode(new Uint8Array(await byPath.get(n.path)!.arrayBuffer()))] as const)));
  } };
}
export function zipVault(bytes: Uint8Array, archiveName: string): ImportVault {
  if (bytes.length > 50 * 1024 * 1024) throw new Error('ZIP-архив должен быть не больше 50 МБ.');
  const entries: { raw: string; size: number; directory: boolean }[] = [];
  try {
    // Read only ZIP metadata. No attachments or note contents are inflated for the tree.
    unzipSync(bytes, { filter: file => {
      if (entries.length >= 50000) throw new Error('Слишком много файлов в архиве');
      entries.push({ raw: file.name, size: file.originalSize, directory: /\/$/.test(file.name) }); return false;
    } });
  } catch { throw new Error('Не удалось прочитать ZIP-архив. Выберите обычный ZIP с Markdown-файлами.'); }
  const safe = entries.filter(e => {
    const parts = e.raw.replaceAll('\\', '/').split('/');
    return !/^[\/]|^[a-z]:/i.test(e.raw) && !parts.includes('..') && !parts[0].startsWith('.') && parts[0] !== '__MACOSX';
  });
  const roots = new Set(safe.map(e => e.raw.replaceAll('\\', '/').split('/')[0]));
  const wrapper = roots.size === 1 && safe.every(e => e.raw.replaceAll('\\', '/').includes('/')) ? [...roots][0] : '';
  const name = wrapper || archiveName.replace(/\.zip$/i, '') || 'Obsidian Vault';
  const paths = safe.map(e => ({ ...e, path: cleanPath(wrapper ? e.raw.replaceAll('\\', '/').slice(wrapper.length + 1) : e.raw) })).filter(e => e.path !== null);
  const notes = paths.filter(e => !e.directory && /\.md$/i.test(e.path!)).map(e => ({ path: e.path!, size: e.size }));
  validateNotes(notes);
  const rawPaths = new Map(paths.map(e => [e.raw, e.path!]));
  return { name, notes, folders: foldersFor(notes, paths.filter(e => e.directory).map(e => e.path!)), readContents: async selected => {
    checkContentSize(notes.filter(n => selected.has(n.path)));
    try {
      const contents = unzipSync(bytes, { filter: e => selected.has(rawPaths.get(e.name) ?? '') });
      return new Map(Object.entries(contents).map(([raw, data]) => [rawPaths.get(raw)!, decode(data)]));
    } catch { throw new Error('Не удалось прочитать выбранные заметки. Проверьте ZIP и кодировку UTF-8.'); }
  } };
}
