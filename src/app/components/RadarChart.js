'use client';

import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

export default function RadarChart({ items = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    // 既存のチャートを破棄
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ラベルとデータを抽出
    const labels = items.map(item => item.name);
    const scores = items.map(item => item.score);

    // チャート作成
    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'スコア',
          data: scores,
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 20,
              color: '#9ca3af',
              backdropColor: 'transparent'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            pointLabels: {
              color: '#fff',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `${context.parsed.r}点`;
              }
            }
          }
        }
      }
    });

    // クリーンアップ
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        データがありません
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <canvas ref={canvasRef} width="400" height="400"></canvas>
    </div>
  );
}