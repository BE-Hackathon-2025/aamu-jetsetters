import { useState, useEffect } from 'react';

const ADMIN_TOUR_STORAGE_KEY = 'admin-dashboard-tour-seen';

export function useAdminTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ADMIN_TOUR_STORAGE_KEY);
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
    localStorage.setItem(ADMIN_TOUR_STORAGE_KEY, 'true');
  };

  return {
    run,
    startTour,
    stopTour,
  };
}

