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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsClient(true);
    try {
      const raw = localStorage.getItem(`analysis_${siteId}`);
      if (raw) setAnalyzedData(JSON.parse(raw));
      if (localStorage.getItem(`trackingInstalled_${siteId}`)) setIsTrackingInstalled(true);
      const saved = localStorage.getItem(`checkedItems_${siteId}`);
      if (saved) setCheckedItems(JSON.parse(saved));
      const visitCount = localStorage.getItem(`visitCount_${siteId}`);
      setDashPreview(visitCount !== null ? parseInt(visitCount, 10) : null);
    } catch (e) {
    } finally {
      setDataLoaded(true);
    }
  }, [siteId]);

  // ② siteIdで履歴管理
  useEffect(() => {
    if (!url || !analyzedData?.totalScore) return;
    try {
      const h = JSON.parse(localStorage.getItem('aiObservatoryHistory') || '[]');
      const prev = h.find((i) => i.siteId === siteId);
      if (prev) {
        setPrevScore(prev.score);
        if (prev.data?.scores) setPrevScores(prev.data.scores);
      }
      const next = [
        { siteId, url, score: analyzedData.totalScore, date: new Date().toISOString(), data: analyzedData },
        ...h.filter((i) => i.siteId !== siteId),
      ];
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(next.slice(0, 10)));
    } catch (e) {}
  }, [url, siteId, analyzedData]);

  // ① checkedItems依存いらない版
  const handleCheck = useCallback((id) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`checkedItems_${siteId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [siteId]);

  // ③ await追加 + honeypot削除
  const handleCopyTracking = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`
      );
      localStorage.setItem(`trackingInstalled_${siteId}`, 'true');
      setIsTrackingInstalled(true);
      alert('コピーしました！サイトのheadタグに貼り付けてください。');
    } catch {
      alert('コピーに失敗しました');
    }
  }, [siteId]);

  const wasImproved = useCallback((id) => {
    if (!prevScores) return false;
    return !!checkedItems[id] && (analyzedData?.scores?.[id] || 0) > (prevScores[id] || 0);
  }, [prevScores, checkedItems, analyzedData]);

  const totalScore = analyzedData?.totalScore ?? 0;

  const currentScores = useMemo(() => analyzedData?.scores || {}, [analyzedData]);

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