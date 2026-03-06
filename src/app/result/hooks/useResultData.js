// src/app/result/hooks/useResultData.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateSiteId } from '../../utils/generateSiteId';
import { getImprovements } from '../constants/improvements';

export function useResultData(url) {
  const [isClient, setIsClient] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [prevScores, setPrevScores] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [isTrackingInstalled, setIsTrackingInstalled] = useState(false);
  const [dashPreview, setDashPreview] = useState(null);

  const siteId = useMemo(() => generateSiteId(url), [url]);

  // ── localStorageからデータ読み込み ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsClient(true);
    try {
      const raw = localStorage.getItem(`analysis_${siteId}`);
      if (raw) setAnalyzedData(JSON.parse(raw));

      if (localStorage.getItem(`trackingInstalled_${siteId}`)) {
        setIsTrackingInstalled(true);
      }

      const saved = localStorage.getItem(`checkedItems_${siteId}`);
      if (saved) setCheckedItems(JSON.parse(saved));

      const visitCount = localStorage.getItem(`visitCount_${siteId}`);
      setDashPreview(visitCount !== null ? parseInt(visitCount, 10) : null);
    } catch (e) {
      // silent
    } finally {
      setDataLoaded(true);
    }
  }, [siteId]);

  // ── 診断履歴の保存 & 前回スコア取得 ──
  useEffect(() => {
    if (!url || !analyzedData?.totalScore) return;
    try {
      const h = JSON.parse(localStorage.getItem('aiObservatoryHistory') || '[]');
      const prev = h.find((i) => i.url === url);
      if (prev) {
        setPrevScore(prev.score);
        if (prev.data?.scores) setPrevScores(prev.data.scores);
      }
      const next = [
        { url, score: analyzedData.totalScore, date: new Date().toISOString(), data: analyzedData },
        ...h.filter((i) => i.url !== url),
      ];
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(next.slice(0, 10)));
    } catch (e) {
      // silent
    }
  }, [url, analyzedData]);

  // ── チェック状態の更新 ──
  const handleCheck = useCallback((id) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try {
      localStorage.setItem(`checkedItems_${siteId}`, JSON.stringify(next));
    } catch (e) {
      // silent
    }
  }, [checkedItems, siteId]);

  // ── トラッキングコードのコピー ──
  const handleCopyTracking = useCallback(() => {
    navigator.clipboard.writeText(
      `<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n` +
      `<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`
    );
    try {
      localStorage.setItem(`trackingInstalled_${siteId}`, 'true');
    } catch (e) {
      // silent
    }
    setIsTrackingInstalled(true);
    alert('コピーしました！サイトのheadタグに貼り付けてください。');
  }, [siteId]);

  // ── 改善反映チェック ──
  const wasImproved = useCallback((id) => {
    if (!prevScores) return false;
    return !!checkedItems[id] && (analyzedData?.scores?.[id] || 0) > (prevScores[id] || 0);
  }, [prevScores, checkedItems, analyzedData]);

  const totalScore = analyzedData?.totalScore ?? 0;

  const currentScores = useMemo(() => {
    return analyzedData?.scores || {};
  }, [analyzedData]);

  const improvements = useMemo(() => {
    if (!analyzedData) return { urgent: [], medium: [], completed: [] };
    return getImprovements(analyzedData);
  }, [analyzedData]);

  return {
    isClient,
    dataLoaded,
    analyzedData,
    siteId,
    totalScore,
    currentScores,
    improvements,
    prevScore,
    prevScores,
    checkedItems,
    isTrackingInstalled,
    dashPreview,
    handleCheck,
    handleCopyTracking,
    wasImproved,
  };
}