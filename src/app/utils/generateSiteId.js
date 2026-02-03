// サイトIDを生成する関数
export function generateSiteId(url) {
  // URLを正規化
  const normalizedUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // シンプルなハッシュ関数
  let hash = 0;
  for (let i = 0; i < normalizedUrl.length; i++) {
    const char = normalizedUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  // 正の数に変換してBase36エンコード（10文字固定）
  const base36 = Math.abs(hash).toString(36);
  return base36.substring(0, 10).padStart(10, '0');
}