// src/app/result/hooks/useResultData.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateSiteId } from '../../utils/generateSiteId';
import { getImprovements } from '../constants/improvements';

export function useResultData(url) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [prevScores, setPrevScores] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [isTrackingInstalled, setIsTrackingInstalled] = useState(false);
  const [dashPreview, setDashPreview] = useState(null);

  // ① urlがnullでも安全
  const siteId = useMemo(() => {
    if (!url) return null;
    return generateSiteId(url);
  }, [url]);

  // localStorage読み込み
  useEffect(() => {
    if (typeof window === 'undefined' || !siteId) return;
    try {
      const raw = localStorage.getItem(`analysis_${siteId}`);
      setAnalyzedData(raw ? JSON.parse(raw) : null);

      const saved = localStorage.getItem(`checkedItems_${siteId}`);
      setCheckedItems(saved ? JSON.parse(saved) : {});

      setIsTrackingInstalled(!!localStorage.getItem(`trackingInstalled_${siteId}`));

      const visitCount = localStorage.getItem(`visitCount_${siteId}`);
      setDashPreview(visitCount !== null ? parseInt(visitCount, 10) : null);
    } catch {
      setAnalyzedData(null);
      setCheckedItems({});
      setIsTrackingInstalled(false);
      setDashPreview(null);
    } finally {
      setDataLoaded(true);
    }
  }, [siteId]);

  // 履歴管理 ③ totalScore=0でも保存される
  useEffect(() => {
    if (!url || !siteId || !analyzedData) return;
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
    } catch {}
  }, [url, siteId, analyzedData]);

  const handleCheck = useCallback((id) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`checkedItems_${siteId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [siteId]);

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