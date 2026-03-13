'use client';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ scores }) {
  const data = {
    labels: scores.map(s => s.name),
    datasets: [{
      label: 'スコア',
      data: scores.map(s => s.score),
      backgroundColor: 'rgba(45, 91, 227, 0.08)',
      borderColor: 'rgba(45, 91, 227, 0.7)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(45, 91, 227, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(45, 91, 227, 1)',
    }]
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#bbbbbb',
          backdropColor: 'transparent',
          font: { size: 10 }
        },
        grid: { color: '#e8e8e8' },
        angleLines: { color: '#e8e8e8' },
        pointLabels: {
          color: '#444444',
          font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111111',
        bodyColor: '#444444',
        borderColor: '#e8e8e8',
        borderWidth: 1,
      }
    },
    maintainAspectRatio: true
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Radar data={data} options={options} />
    </div>
  );
}