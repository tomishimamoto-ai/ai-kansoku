import { neon } from '@neondatabase/serverless';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);
  
  // 7日以上前のデータを全部削除
  await sql`
    DELETE FROM ai_crawler_visits 
    WHERE visited_at < NOW() - INTERVAL '7 days'
  `;

  return Response.json({ ok: true, message: '7日以上前のデータを削除しました' });
}