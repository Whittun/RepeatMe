import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, Length, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DataSource } from 'typeorm';
import { Card, Category } from './entities';

class ImportNoteDto {
  @IsString() @Length(1, 2000) path!: string;
  @IsOptional() @IsString() @MaxLength(100000) content?: string;
}
export class ObsidianImportDto {
  @IsString() @Length(1, 200) vaultName!: string;
  @IsOptional() @IsString() @MaxLength(2000) vaultPrefix?: string;
  @IsOptional() @IsString() @MaxLength(2000) basePath?: string;
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsArray() @ArrayMaxSize(1000) @IsString({ each: true }) @MaxLength(2000, { each: true }) folders!: string[];
  @IsArray() @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => ImportNoteDto) notes!: ImportNoteDto[];
}
function parts(value: string): string[] {
  if (!value) return [];
  if (/^[\\/]|^[a-z]:|[\x00-\x1f]/i.test(value)) throw new BadRequestException('Недопустимый путь в импорте');
  const result = value.replaceAll('\\', '/').split('/');
  if (result.length > 32 || result.some(p => !p || p.startsWith('.') || p === '__MACOSX' || p.length > 200)) {
    throw new BadRequestException('Пути должны быть относительными, без скрытых и служебных папок; имя — до 200 символов');
  }
  return result;
}
function sourceKey(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'obsidian:' || url.hostname !== 'open') return;
    const vault = url.searchParams.get('vault'), file = url.searchParams.get('file');
    if (!vault || !file) return;
    return JSON.stringify([vault.toLowerCase(), file.replaceAll('\\', '/').replace(/\.md$/i, '').toLowerCase()]);
  } catch { return; }
}
@Injectable()
export class ObsidianImportService {
  constructor(private readonly db: DataSource) {}
  async import(dto: ObsidianImportDto) {
    const vaultName = dto.vaultName.trim();
    if (!vaultName) throw new BadRequestException('Укажите имя хранилища Obsidian');
    const base = parts(dto.basePath ?? ''), prefix = parts(dto.vaultPrefix ?? '');
    const strip = Math.max(0, base.length - 1), folders = new Set<string>();
    const normalize = (raw: string) => {
      const p = parts(raw);
      if (base.some((v, i) => p[i] !== v)) throw new BadRequestException('Выбранный файл находится вне ветки импорта');
      return p;
    };
    const addFolders = (p: string[]) => { for (let i = strip + 1; i <= p.length; i++) folders.add(p.slice(strip, i).join('/')); };
    for (const folder of dto.folders) { const p = normalize(folder); if (!p.length) throw new BadRequestException('Пустой путь категории'); addFolders(p); }
    const notes = dto.notes.map(note => {
      const p = normalize(note.path), name = p.at(-1) ?? '';
      if (!/\.md$/i.test(name) || !name.slice(0, -3).trim()) throw new BadRequestException('Импортируются только Markdown-заметки с непустым названием');
      addFolders(p.slice(0, -1));
      const source = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent([...prefix, ...p].join('/').slice(0, -3))}`;
      if (source.length > 4000) throw new BadRequestException('Слишком длинная ссылка на заметку');
      return { title: name.slice(0, -3).trim(), folder: p.slice(strip, -1).join('/'), source, content: note.content ?? '' };
    });
    if (!folders.size && !notes.length) throw new BadRequestException('Выберите категории или заметки');
    if (folders.size > 1000 || notes.reduce((n, note) => n + note.content.length, 0) > 1000000) {
      throw new BadRequestException('Слишком большой импорт: до 1000 категорий и 1 миллиона символов текста за один раз');
    }
    return this.db.transaction(async m => {
      await m.query('SELECT pg_advisory_xact_lock(192017)');
      if (dto.parentId && !await m.existsBy(Category, { id: dto.parentId })) throw new NotFoundException('Категория назначения не найдена');
      const categories = await m.find(Category), cards = await m.find(Card);
      const ids = new Map<string, string | null>([['', dto.parentId ?? null]]);
      const result = { categoriesCreated: 0, cardsCreated: 0, cardsSkipped: 0 };
      for (const folder of [...folders].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))) {
        const segments = folder.split('/'), name = segments.at(-1)!.trim();
        if (!name) throw new BadRequestException('Пустое название категории');
        const parentId = ids.get(segments.slice(0, -1).join('/')) ?? null;
        const matches = categories.filter(c => c.name === name && c.parentId === parentId);
        if (matches.length > 1) throw new ConflictException(`Несколько категорий «${name}» в одном месте. Уточните категорию назначения.`);
        let category = matches[0];
        if (!category) { category = await m.save(Category, m.create(Category, { name, parentId })); categories.push(category); result.categoriesCreated++; }
        ids.set(folder, category.id);
      }
      const sources = new Set(cards.flatMap(c => c.sources.map(s => sourceKey(s.url)).filter(Boolean)));
      for (const note of notes) {
        const categoryId = ids.get(note.folder) ?? null, key = sourceKey(note.source)!;
        if (sources.has(key) || cards.some(c => c.title === note.title && c.categoryId === categoryId)) { result.cardsSkipped++; continue; }
        const card = await m.save(Card, m.create(Card, { title: note.title, categoryId, explanation: note.content,
          criteria: '', sources: [{ label: 'Заметка в Obsidian', url: note.source }], streak: 0, lastResult: null, nextReview: null }));
        cards.push(card); sources.add(key); result.cardsCreated++;
      }
      return result;
    });
  }
}
