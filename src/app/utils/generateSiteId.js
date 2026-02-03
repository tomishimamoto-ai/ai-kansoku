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
  
  // 正の数に変換してBase36エンコード
  const hashStr = Math.abs(hash).toString(36);
  
  // タイムスタンプの下6桁を追加（重複防止）
  const timestamp = Date.now().toString(36).slice(-6);
  
  // 組み合わせて12文字のIDを生成
  return (hashStr + timestamp).slice(0, 12);
}