import { useEffect } from 'react';
import './ThemeToggle.css';

function ThemeToggle() {
  useEffect(() => {
    // Force dark mode only
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Hidden component - dark mode only, no toggle needed
  return null;
}

export default ThemeToggle;

