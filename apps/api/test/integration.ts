// Creates and drops only a uniquely named disposable test database.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { DataSource, DataSourceOptions } from 'typeorm';
import dataSource from '../src/data-source';
import { KnowledgeService } from '../src/knowledge.service';
import { Card, Attempt } from '../src/entities';
import { randomUUID } from 'node:crypto';

async function main() {
  const database = `repeatme_test_${randomUUID().replaceAll('-', '')}`;
  const admin = await new DataSource({ type: 'postgres', url: process.env.DATABASE_URL ?? 'postgresql://repeatme:repeatme@localhost:5432/repeatme' }).initialize();
  let test: DataSource | undefined;
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
    const url = new URL(process.env.DATABASE_URL ?? 'postgresql://repeatme:repeatme@localhost:5432/repeatme');
    url.pathname = `/${database}`;
    test = await new DataSource({ ...dataSource.options, url: url.toString() } as DataSourceOptions).initialize();
    await test.runMigrations();
    const service = new KnowledgeService(test);
    const a = await service.saveCategory({ name: 'Разработка' });
    const b = await service.saveCategory({ name: 'JavaScript', parentId: a.id });
    const c = await service.saveCategory({ name: 'Асинхронность', parentId: b.id });
    await assert.rejects(service.saveCategory({ name: a.name, parentId: c.id }, a.id), /потомка/);
    await assert.rejects(service.deleteCategory(a.id), /пустую/);
    const card = await service.saveCard({ title: 'Promise', categoryId: c.id, criteria: 'Объяснить состояния Promise', sources: [{ label: 'Мой чат', url: 'https://chatgpt.com/c/example' }] });
    let snapshot = await service.snapshot(a.id);
    assert.equal(snapshot.stats.total, 1); assert.equal(snapshot.stats.counts.new, 1);
    assert.deepEqual(snapshot.queue, [card.id]);
    const requestId = randomUUID();
    const [first, retry] = await Promise.all([service.review(card.id, { remembered: true, requestId }), service.review(card.id, { remembered: true, requestId })]);
    assert.equal(first.id, retry.id);
    assert.equal((await service.history(card.id)).length, 1);
    snapshot = await service.snapshot(a.id);
    assert.equal(snapshot.stats.counts.weak, 1); assert.equal(snapshot.stats.due, 0);
    for (const category of snapshot.categories) assert.equal(category.stats.checked, 1);
    await service.saveCard({ title: card.title, categoryId: a.id, sources: card.sources, criteria: card.criteria }, card.id);
    assert.equal((await service.history(card.id)).length, 1);
    assert.equal((await service.snapshot(c.id)).stats.total, 0);
    await service.review(card.id, { remembered: false, requestId: randomUUID() });
    assert.equal((await service.snapshot()).stats.counts.forgotten, 1);
    await service.review(card.id, { remembered: true, requestId: randomUUID() });
    assert.equal((await test.manager.findOneByOrFail(Card, { id: card.id })).streak, 1);
    // Invalid insert fails after updating schedule; transaction must roll that update back.
    const before = await test.manager.findOneByOrFail(Card, { id: card.id });
    await assert.rejects(service.review(card.id, { remembered: true, requestId: 'invalid-uuid' }));
    const after = await test.manager.findOneByOrFail(Card, { id: card.id });
    assert.equal(after.streak, before.streak); assert.equal(after.nextReview, before.nextReview);
    assert.equal(await test.manager.count(Attempt), 3);
    await service.deleteCategory(c.id); await service.deleteCategory(b.id);
    await service.deleteCard(card.id);
    assert.equal(await test.manager.count(Attempt), 0);
    await service.deleteCategory(a.id);
    assert.equal((await service.snapshot()).stats.total, 0);
    await test.undoLastMigration(); await test.runMigrations();
    console.log('PASS: migrations/revert, persistence, nested statistics, cycles, nonempty deletion, concurrent retry, review reset, move/history, rollback and cascade.');
  } finally {
    if (test?.isInitialized) await test.destroy();
    await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
    await admin.destroy();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
