// src/app/result/constants/healthStatus.js

export const HEALTH_STATUS = {
  CRITICAL: {
    code: 'CRITICAL',
    ja: '要緊急処置',
    desc: 'AIクローラーにほぼ発見されていない可能性があります',
    nextDesc: 'CAUTIONに到達すると、主要AIクローラーに認識され始めます',
    color: '#ff5555',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  CAUTION: {
    code: 'CAUTION',
    ja: '要経過観察',
    desc: '基本設定は揃っています。改善でAI露出が向上します',
    nextDesc: 'STABLEに到達すると、AIに安定して認識されます',
    color: '#f59e0b',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  STABLE: {
    code: 'STABLE',
    ja: '安定観測中',
    desc: 'AIクローラーに適切に認識されています',
    nextDesc: 'OPTIMALに到達すると、AIに最優先で認識・引用されます',
    color: '#4a9eff',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  OPTIMAL: {
    code: 'OPTIMAL',
    ja: '最適化済',
    desc: 'AIクローラーへの可視性は最高レベルです',
    nextDesc: null,
    color: '#00ffc8',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

export function getHealthStatus(score) {
  if (score >= 90) return HEALTH_STATUS.OPTIMAL;
  if (score >= 70) return HEALTH_STATUS.STABLE;
  if (score >= 40) return HEALTH_STATUS.CAUTION;
  return HEALTH_STATUS.CRITICAL;
}

export function getNextTarget(score) {
  if (score < 40) return { target: 40, label: 'CAUTION', diff: 40 - score };
  if (score < 70) return { target: 70, label: 'STABLE', diff: 70 - score };
  if (score < 90) return { target: 90, label: 'OPTIMAL', diff: 90 - score };
  return null;
}