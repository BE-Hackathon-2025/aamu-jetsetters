import { useState, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'community-dashboard-tour-seen';

export function useTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!seen) {
      setTimeout(() => {
        setRun(true);
      }, 1000);
    }
  }, []);

  const startTour = () => {
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  return {
    run,
    startTour,
    stopTour,
  };
}

