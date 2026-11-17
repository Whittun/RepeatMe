import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from './api';
import { Sidebar } from './Sidebar';
import { Overview, Status } from './Overview';
import { Editor, Modal } from './Forms';
import { CardView } from './CardView';
import { Review } from './Review';
import type { Snapshot, Card, Category } from './types';
import s from './app.module.css';
export default function App() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ type: 'card' | 'category'; item?: Card | Category } | null>(null);
  const [session, setSession] = useState<Card[] | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const version = useRef(0);
  const load = useCallback(async () => {
    const n = ++version.current; setLoading(true); setError('');
    try { const result = await api<Snapshot>(`snapshot${categoryId ? `?categoryId=${categoryId}` : ''}`); if (n === version.current) setData(result); }
    catch (e) { if (n === version.current) setError((e as Error).message); }
    finally { if (n === version.current) setLoading(false); }
  }, [categoryId]);
  useEffect(() => { void load(); const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 60000); return () => { ++version.current; clearInterval(timer); }; }, [load]);
  const card = data?.cards.find(c => c.id === cardId);
  const category = data?.categories.find(c => c.id === categoryId);
  const selectCategory = (id: string | null) => { setCategoryId(id); setCardId(null); };
  const start = () => { if (!data || loading || error) return; setQueueOpen(false); setSession(data.queue.map(id => data.cards.find(c => c.id === id)!)); };
  async function saved() {
    // A category may have been deleted; return to a valid root view.
    setCardId(null);
    if (categoryId) { setCategoryId(null); }
    else { await load(); }
  }
  return <div className={s.app}>
    {data ? <Sidebar data={data} categoryId={categoryId} cardId={cardId} onCategory={selectCategory} onCard={c => setCardId(c.id)} onCreate={type => setEditor({ type })}/> : <aside className={s.sidebar}><h2>RepeatMe</h2><p className={s.muted}>Карта ваших знаний</p></aside>}
    <main className={s.main}><header className={s.topbar}><div>Моя карта <ChevronRight size={14}/><span>{session ? 'Повторение' : card ? 'Карточка' : category?.name ?? 'Обзор'}</span></div><div><span className={s.localDot}/>Личное пространство <span className={s.avatar}>Я</span></div></header>
      <div className={s.content}>{error && <div className={s.error} role="alert">{error}<button onClick={() => void load()}><RefreshCw size={16}/>Повторить</button>{categoryId && <button onClick={() => selectCategory(null)}>В общий обзор</button>}</div>}
      {!data ? <section className={s.empty}><h1>{loading ? 'Открываем вашу карту…' : 'Не удалось загрузить карту'}</h1><p className={s.muted}>Для работы нужны запущенные API и PostgreSQL.</p></section> : session ? <Review cards={session} onExit={() => { setSession(null); void load(); }}/>
        : <div aria-busy={loading} className={loading ? s.loading : ''}>{card ? <CardView key={`${card.id}-${card.streak}-${card.nextReview}`} card={card} categories={data.categories} onEdit={() => setEditor({ type: 'card', item: card })} onReview={() => setSession([card])}/> : <Overview data={data} categoryId={categoryId} onCategory={selectCategory} onCard={c => setCardId(c.id)} onCreate={type => setEditor({ type })} onEdit={() => setEditor({ type: 'category', item: category })} onReview={start} onQueue={() => setQueueOpen(true)}/>}</div>}
      </div><footer className={s.footer}>RepeatMe <span>Учитесь новому. Возвращайтесь к важному.</span><span>Europe/Moscow · МСК</span></footer>
    </main>
    {editor && data && <Editor type={editor.type} item={editor.item} categories={data.categories} parentId={categoryId} onClose={() => setEditor(null)} onSaved={saved}/>}
    {queueOpen && data && <Modal title="Очередь повторения" onClose={() => setQueueOpen(false)}><p className={s.muted}>Сначала забытые, затем новые и остальные карточки.</p><div className={s.queueList}>{data.queue.map((id, i) => { const c = data.cards.find(c => c.id === id)!; return <div key={id}><span>{i + 1}.</span><strong>{c.title}</strong><Status card={c}/></div>; })}</div>{!data.queue.length && <p>В этой области пока нет карточек к повторению.</p>}<button className={s.primary} disabled={!data.queue.length || loading || !!error} onClick={start}>Начать повторение<ArrowRight size={17}/></button></Modal>}
  </div>;
}
