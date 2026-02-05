'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [history, setHistory] = useState([]);

  // URLバリデーション
  const validateUrl = (inputUrl) => {
    if (!inputUrl.trim()) {
      return { valid: false, error: 'URLを入力してください' };
    }

    // http/https を自動追加
    let normalizedUrl = inputUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // URL形式チェック
    try {
      const urlObj = new URL(normalizedUrl);
      if (!urlObj.hostname.includes('.')) {
        return { valid: false, error: '有効なドメインを入力してください（例: example.com）' };
      }
      return { valid: true, url: normalizedUrl };
    } catch (e) {
      return { valid: false, error: '有効なURLを入力してください（例: https://example.com）' };
    }
  };

  // 診断履歴を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const historyStr = localStorage.getItem('aiObservatoryHistory');
        if (historyStr) {
          const parsedHistory = JSON.parse(historyStr);
          setHistory(parsedHistory.slice(0, 5)); // 最新5件のみ表示
        }
      } catch (error) {
        console.error('履歴の読み込みに失敗:', error);
      }
    }
  }, []);

  // 履歴をクリア
  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aiObservatoryHistory');
      setHistory([]);
    }
  };

  // 履歴から再診断
  const diagnoseFromHistory = (historyUrl) => {
    setUrl(historyUrl);
    setTimeout(() => {
      handleAnalyze();
    }, 100);
  };

  const handleAnalyze = async () => {
    // エラーをリセット
    setError(null);

    // URLバリデーション
    const validation = validateUrl(url);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setLoadingStep('準備中...');

    // タイムアウト設定（30秒）
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('タイムアウトしました。サイトの読み込みに時間がかかりすぎています。後でもう一度お試しください。');
    }, 30000);

    try {
      setLoadingStep('サイトに接続中...');

      // APIを呼び出す
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validation.url })
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        setLoadingStep('分析完了！');
        
        // 結果ページに遷移（データをURLパラメータで渡す）
        const params = new URLSearchParams({
          url: validation.url,
          score: data.totalScore,
          data: JSON.stringify(data)
        });
        window.location.href = `/result?${params.toString()}`;
      } else {
        clearTimeout(timeoutId);
        setLoading(false);
        
        // エラーメッセージをユーザーフレンドリーに
        let errorMessage = data.error || '診断中にエラーが発生しました';
        
        if (response.status === 404) {
          errorMessage = 'サイトが見つかりませんでした。URLを確認してください。';
        } else if (response.status === 500) {
          errorMessage = 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。';
        } else if (response.status === 403) {
          errorMessage = 'アクセスが拒否されました。サイトがクロールを許可していない可能性があります。';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setLoading(false);
      
      // ネットワークエラー
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してください。');
      } else {
        setError('診断に失敗しました。URLを確認して再度お試しください。');
      }
      
      console.error('診断エラー:', error);
    }
  };

  return (
    <>
      {/* ローディングオーバーレイ */}
      {loading && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-4 w-16 h-16 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin-reverse" />
            </div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              診断中...
            </h3>
            <p className="text-gray-400">{loadingStep}</p>
            <p className="text-gray-500 text-sm mt-4">最大30秒かかる場合があります</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="border-b border-white/10 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
              </div>
              <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
                <a href="/how-to-use" className="text-gray-400 hover:text-white transition-colors">使い方</a>
                <a href="/guide" className="text-gray-400 hover:text-white transition-colors">改善ガイド</a>
                <a href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                <a href="https://blog.ai-kansoku.com" target="_blank">ブログ</a>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-4xl mx-auto px-6 pt-20 md:pt-32 pb-12 md:pb-20 text-center">
            <div className="inline-block mb-4 md:mb-6">
              <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs md:text-sm">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  ✨ AIクロール可視化ツール
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                あなたのサイトは
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AIに好かれていますか？
              </span>
            </h1>

            <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              ChatGPT、Claude、Perplexityなど主要AIがあなたのサイトをどう見ているか、
              30秒で診断します。
            </p>

            {/* Input Area */}
            <div className="max-w-2xl mx-auto mb-8 md:mb-12">
              <div 
                className={`relative group transition-all duration-300 ${
                  focused ? 'scale-[1.02]' : ''
                }`}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
                
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-2">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null); // 入力時にエラーをクリア
                      }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                      placeholder="example.com"
                      className="flex-1 bg-transparent px-4 py-3 md:py-4 text-base md:text-lg outline-none placeholder:text-gray-500"
                    />
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !url}
                      className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 text-base md:text-base"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          診断中
                        </span>
                      ) : (
                        '診断する'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="text-red-400 text-xl">⚠️</div>
                    <div className="flex-1">
                      <p className="text-red-400 text-sm font-medium mb-2">エラーが発生しました</p>
                      <p className="text-red-300/80 text-sm">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                🔒 登録不要 • 完全無料 • データは保存されません
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-20 px-4">
              {[
                { icon: '📊', title: '構造化データ', desc: 'Schema.orgの実装状況' },
                { icon: '🤖', title: 'robots.txt', desc: 'AIクローラーの許可設定' },
                { icon: '🗺️', title: 'サイトマップ', desc: 'sitemap.xmlの最適化' }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                >
                  <div className="text-3xl md:text-4xl mb-3 md:mb-4">{feature.icon}</div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            {/* 診断履歴 */}
            {history.length > 0 && (
              <div className="mt-12 md:mt-20 px-4">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold">📚 診断履歴</h2>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-gray-400 hover:text-white transition-colors underline"
                    >
                      すべてクリア
                    </button>
                  </div>

                  <div className="space-y-4">
                    {history.map((item, i) => {
                      const date = new Date(item.date);
                      const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                      
                      // 前回のスコアと比較
                      const previousItem = history[i + 1];
                      let scoreDiff = null;
                      if (previousItem && previousItem.url === item.url) {
                        scoreDiff = item.score - previousItem.score;
                      }
                      
                      return (
                        <div
                          key={i}
                          className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold truncate">{item.url.replace(/https?:\/\//, '')}</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`text-2xl font-bold ${
                                    item.score >= 80 ? 'text-green-400' :
                                    item.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>
                                    {item.score}点
                                  </span>
                                  {scoreDiff !== null && scoreDiff !== 0 && (
                                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                      scoreDiff > 0 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {scoreDiff > 0 ? '📈' : '📉'} {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-400">{formattedDate}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => diagnoseFromHistory(item.url)}
                                className="flex-1 md:flex-none px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
                              >
                                🔄 再診断
                              </button>
                              <a
                                href={`/result?url=${encodeURIComponent(item.url)}&data=${encodeURIComponent(JSON.stringify(item.data))}`}
                                className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 text-center"
                              >
                                📊 詳細
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}