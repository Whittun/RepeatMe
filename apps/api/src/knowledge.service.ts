import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Category, Card, Attempt } from './entities';
import { CategoryDto, CardDto, ReviewDto } from './dto';
import { branchIds, decorate, inScope, reviewQueue, schedule, statistics, today } from './rules';

@Injectable()
export class KnowledgeService {
  constructor(private readonly db: DataSource) {}
  private async required<T>(value: Promise<T | null>): Promise<T> {
    const result = await value;
    if (!result) throw new NotFoundException('Объект не найден. Обновите страницу.');
    return result;
  }
  // One transaction lock serializes tree changes, including simultaneous reparenting.
  private structure<T>(fn: (m: EntityManager) => Promise<T>) {
    return this.db.transaction(async m => { await m.query('SELECT pg_advisory_xact_lock(192017)'); return fn(m); });
  }
  async snapshot(root?: string) {
    return this.db.transaction('REPEATABLE READ', async m => {
      const categories = await m.find(Category, { order: { name: 'ASC', id: 'ASC' } });
      if (root && !categories.some(c => c.id === root)) throw new NotFoundException('Категория не найдена');
      const cards = await m.find(Card, { order: { createdAt: 'ASC', id: 'ASC' } });
      const day = today();
      const scoped = inScope(cards, categories, root);
      return {
        today: day,
        categories: categories.map(c => ({ ...c, stats: statistics(inScope(cards, categories, c.id), day) })),
        cards: cards.map(c => decorate(c, day)),
        stats: statistics(scoped, day),
        queue: reviewQueue(scoped, day).map(c => c.id),
      };
    });
  }
  async saveCategory(dto: CategoryDto, id?: string) {
    return this.structure(async m => {
      const category = id ? await this.required(m.findOneBy(Category, { id })) : m.create(Category);
      const parentId = dto.parentId ?? null;
      if (parentId) {
        await this.required(m.findOneBy(Category, { id: parentId }));
        const categories = await m.find(Category);
        if (id && branchIds(categories, id).has(parentId)) throw new BadRequestException('Нельзя переместить категорию в себя или своего потомка');
      }
      return m.save(Category, Object.assign(category, { name: dto.name, parentId }));
    });
  }
  async deleteCategory(id: string) {
    return this.structure(async m => {
      await this.required(m.findOneBy(Category, { id }));
      if (await m.countBy(Category, { parentId: id }) || await m.countBy(Card, { categoryId: id })) {
        throw new ConflictException('Удалить можно только пустую категорию. Сначала переместите карточки и подкатегории.');
      }
      await m.delete(Category, id);
    });
  }
  async saveCard(dto: CardDto, id?: string) {
    return this.structure(async m => {
      const card = id ? await this.required(m.findOne(Card, { where: { id }, lock: { mode: 'pessimistic_write' } })) : m.create(Card, { streak: 0, lastResult: null, nextReview: null });
      if (dto.categoryId) await this.required(m.findOneBy(Category, { id: dto.categoryId }));
      Object.assign(card, { title: dto.title, categoryId: dto.categoryId ?? null,
        explanation: dto.explanation ?? '', criteria: dto.criteria ?? '', sources: dto.sources ?? [] });
      return m.save(Card, card);
    });
  }
  async deleteCard(id: string) {
    const result = await this.db.getRepository(Card).delete(id);
    if (!result.affected) throw new NotFoundException('Карточка не найдена');
  }
  async history(id: string) {
    await this.required(this.db.getRepository(Card).findOneBy({ id }));
    return this.db.getRepository(Attempt).find({ where: { cardId: id }, order: { createdAt: 'DESC', id: 'DESC' } });
  }
  async review(id: string, dto: ReviewDto) {
    return this.db.transaction(async m => {
      const card = await this.required(m.findOne(Card, { where: { id }, lock: { mode: 'pessimistic_write' } }));
      // A retry after a lost response returns the original result, without a second attempt.
      const existing = await m.findOneBy(Attempt, { requestId: dto.requestId });
      if (existing) {
        if (existing.cardId !== id || existing.remembered !== dto.remembered) throw new ConflictException('Идентификатор попытки уже использован');
        return existing;
      }
      const next = schedule(card.streak, dto.remembered, today());
      Object.assign(card, next);
      await m.save(Card, card);
      return m.save(Attempt, m.create(Attempt, { cardId: id, remembered: dto.remembered, nextReview: next.nextReview, requestId: dto.requestId }));
    });
  }
}
