export async function supabaseRequest<T>(payload: {
  action: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  match?: Record<string, any>;
  data?: any;
  order?: { column: string; ascending?: boolean };
  single?: boolean;
}) {
  const res = await fetch('/api/supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Gagal terhubung ke Supabase');
  }

  const data = (await res.json()) as { data: T };
  return data.data;
}
