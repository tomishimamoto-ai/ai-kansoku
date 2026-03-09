// サイトIDを生成する関数
export function generateSiteId(url) {
  if (!url) return '0000000000';

  const normalizedUrl = url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  let hash = 0;

  for (let i = 0; i < normalizedUrl.length; i++) {
    const char = normalizedUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }

  const base36 = Math.abs(hash).toString(36);

  return base36.slice(0, 10).padStart(10, '0');
}