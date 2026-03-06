// src/app/result/hooks/useCountUp.js
import { useState, useEffect } from 'react';

export function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return val;
}