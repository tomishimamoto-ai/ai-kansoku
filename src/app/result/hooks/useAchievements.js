// src/app/result/hooks/useAchievements.js
import { useState, useEffect } from 'react';

export function useAchievements({ totalScore, prevScore, prevScores, currentScores, checkedItems }) {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (prevScore === null || !prevScores) return;

    const list = [];
    const diff = totalScore - prevScore;

    if (diff > 0) {
      list.push({
        emoji: diff >= 10 ? '🔥' : '✨',
        text: `スコアが ${diff}点 アップ！`,
      });
    }

    const names = {
      metaTags: 'メタタグ',
      performance: 'パフォーマンス',
      sitemap: 'サイトマップ',
      structuredData: '構造化データ',
      semanticHTML: 'セマンティックHTML',
      robotsTxt: 'robots.txt',
      llmsTxt: 'llms.txt',
      mobileOptimization: 'モバイル対応',
    };

    Object.entries(checkedItems).forEach(([id, done]) => {
      if (!done) return;
      const diff = (currentScores[id] || 0) - (prevScores[id] || 0);
      if (diff > 0) {
        list.push({
          emoji: '🟢',
          text: `${names[id] || id} が改善 (+${diff}点)`,
        });
      }
    });

    setAchievements(list);
  }, [prevScore, prevScores]); // eslint-disable-line react-hooks/exhaustive-deps

  return achievements;
}