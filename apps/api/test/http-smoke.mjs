import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const base = process.env.API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3001}/api`;
async function request(path, method = 'GET', body, expected = 200) {
  const r = await fetch(`${base}/${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  assert.equal(r.status, expected, `${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : undefined;
}
let category, card, importedCard;
try {
  await request('cards', 'POST', { title: '   ' }, 400);
  await request('cards', 'POST', { title: 'Invalid', sources: [{ label: 'bad', url: 'javascript:alert(1)' }] }, 400);
  await request('snapshot?categoryId=invalid', 'GET', undefined, 400);
  category = await request('categories', 'POST', { name: `HTTP smoke ${randomUUID()}` }, 201);
  card = await request('cards', 'POST', { title: 'Promise — HTTP test', categoryId: category.id, criteria: 'Объяснить состояния Promise', explanation: '**Заметка**\n\n```js\nPromise.resolve(1)\n```', sources: [{ label: 'Мой чат', url: 'https://chatgpt.com/c/example' }, { label: 'Заметка', url: 'obsidian://open?vault=Notes&file=Promise' }] }, 201);
  const getScope = () => request(`snapshot?categoryId=${category.id}`);
  assert.equal((await getScope()).stats.counts.new, 1);
  await request(`categories/${category.id}`, 'DELETE', undefined, 409);
  const payload = { remembered: true, requestId: randomUUID() };
  const saved = await request(`cards/${card.id}/reviews`, 'POST', payload, 201);
  const retry = await request(`cards/${card.id}/reviews`, 'POST', payload, 201);
  assert.equal(saved.id, retry.id);
  await request(`cards/${card.id}/reviews`, 'POST', { ...payload, remembered: false }, 409);
  const reloaded = await getScope();
  assert.equal(reloaded.stats.checked, 1); assert.equal(reloaded.stats.counts.weak, 1);
  assert.equal(reloaded.queue.length, 0); assert.equal(reloaded.cards.find(c => c.id === card.id).nextReview, saved.nextReview);
  assert.equal((await request(`cards/${card.id}/history`)).length, 1);
  await request(`cards/${card.id}`, 'PUT', { title: card.title, streak: 99 }, 400);
  await request(`cards/${card.id}`, 'PUT', { ...{ title: card.title, criteria: card.criteria, sources: card.sources, explanation: card.explanation }, categoryId: null });
  assert.equal((await getScope()).stats.total, 0);
  assert.equal((await request(`cards/${card.id}/history`)).length, 1);
  const importPayload = { vaultName: `HTTP fixture ${randomUUID()}`, parentId: category.id, folders: [], notes: [{ path: 'Selected.md', content: '# Selected' }] };
  await request('imports/obsidian', 'POST', { ...importPayload, notes: [{ path: '../outside.md' }] }, 400);
  await request('imports/obsidian', 'POST', { ...importPayload, notes: [{ path: 'Bad.md', content: 42 }] }, 400);
  await request('imports/obsidian', 'POST', { ...importPayload, vaultName: '' }, 400);
  const imported = await request('imports/obsidian', 'POST', importPayload, 201);
  importedCard = (await getScope()).cards.find(c => c.title === 'Selected' && c.categoryId === category.id);
  assert.equal(imported.cardsCreated, 1); assert.equal(importedCard.explanation, '# Selected');
  const repeated = await request('imports/obsidian', 'POST', importPayload, 201);
  assert.equal(repeated.cardsCreated, 0); assert.equal(repeated.cardsSkipped, 1);
  console.log('PASS HTTP: validation, persistence, reviews, move/history, selected import, content and duplicate prevention.');
} finally {
  if (card) await request(`cards/${card.id}`, 'DELETE');
  if (importedCard) await request(`cards/${importedCard.id}`, 'DELETE');
  if (category) await request(`categories/${category.id}`, 'DELETE');
}
