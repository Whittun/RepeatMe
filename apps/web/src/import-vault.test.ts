import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { cleanPath, folderVault, isWithin, zipVault } from './import-vault';

describe('импорт Obsidian', () => {
  it('сохраняет кириллицу и вложенность ZIP, убирает обёртку и служебные файлы', async () => {
    const vault = zipVault(zipSync({
      'My Vault/Разработка/Nest/Модули.md': strToU8('# Модули'),
      'My Vault/Английский/Words.md': strToU8('Do not import'),
      'My Vault/.obsidian/config.json': strToU8('{}'),
      'My Vault/Picture.png': new Uint8Array([1, 2]),
      '__MACOSX/._metadata': new Uint8Array(),
      '../outside.md': strToU8('outside'),
      'My Vault/Empty/': new Uint8Array(),
    }), 'backup.zip');
    expect(vault.name).toBe('My Vault');
    expect(vault.notes.map(n => n.path)).toEqual(['Разработка/Nest/Модули.md', 'Английский/Words.md']);
    expect(vault.folders).toContain('Empty');
    expect(vault.folders).not.toContain('.obsidian');
    const contents = await vault.readContents(new Set(['Разработка/Nest/Модули.md']));
    expect([...contents]).toEqual([['Разработка/Nest/Модули.md', '# Модули']]);
  });
  it('читает структуру папки без загрузки текстов и сохраняет пути для ссылок', async () => {
    const file = new File(['# Note'], 'Note.md');
    Object.defineProperty(file, 'webkitRelativePath', { value: 'Vault/Backend/Note.md' });
    const vault = folderVault([file]);
    expect(vault.name).toBe('Vault');
    expect(vault.folders).toEqual(['Backend']);
    expect(vault.notes[0].path).toBe('Backend/Note.md');
    expect((await vault.readContents(new Set(['Backend/Note.md']))).get('Backend/Note.md')).toBe('# Note');
  });
  it('не читает содержимое заметки, которая не выбрана', async () => {
    const file = new File(['private'], 'Hidden.md');
    Object.defineProperty(file, 'webkitRelativePath', { value: 'Vault/English/Hidden.md' });
    file.arrayBuffer = () => { throw new Error('Unselected note was read'); };
    expect((await folderVault([file]).readContents(new Set())).size).toBe(0);
  });
  it('отклоняет обходы пути, скрытые файлы, повреждённые и слишком большие архивы', () => {
    for (const p of ['../a.md', '/a.md', 'C:/a.md', '.obsidian/a.md', 'a/../b.md', '__MACOSX/a.md']) expect(cleanPath(p)).toBeNull();
    expect(cleanPath('Backend\\Nest\\Note.md')).toBe('Backend/Nest/Note.md');
    expect(isWithin('Backend/Nest.md', 'Backend')).toBe(true);
    expect(isWithin('Backend2/Note.md', 'Backend')).toBe(false);
    expect(() => zipVault(strToU8('not a zip'), 'bad.zip')).toThrow();
    expect(() => zipVault(new Uint8Array(50 * 1024 * 1024 + 1), 'large.zip')).toThrow();
  });
  it('ограничивает число заметок и объём распаковки выбранного текста', async () => {
    const files = Array.from({ length: 1001 }, (_, i) => new File([''], `${i}.md`));
    expect(() => folderVault(files)).toThrow('1000');
    const vault = zipVault(zipSync({ 'Large.md': strToU8('x'.repeat(400001)) }), 'large.zip');
    await expect(vault.readContents(new Set(['Large.md']))).rejects.toThrow('1 МБ');
    expect((await vault.readContents(new Set())).size).toBe(0);
  });
});
