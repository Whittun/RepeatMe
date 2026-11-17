export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('Нет связи с сервером. Проверьте подключение и повторите.'); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(data.message) ? data.message.join('. ') : data.message || 'Не удалось выполнить действие');
  }
  const text = await response.text();
  return text ? JSON.parse(text) : undefined;
}
