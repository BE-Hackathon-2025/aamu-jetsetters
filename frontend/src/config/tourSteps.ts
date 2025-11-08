import type { Step } from 'react-joyride';

export const tourSteps: Step[] = [
  {
    target: '[data-tour="status-card"]',
    content: 'This shows your overall water safety status. The colored text indicates the current risk level - from Stable (green) to Critical (red).',
    placement: 'bottom',
    title: 'Water Safety Status',
    disableBeacon: true,
  },
  {
    target: '[data-tour="health-advisory"]',
    content: 'Read the health advisory for important safety instructions based on current water quality conditions. Click "View Details" to see more information.',
    placement: 'bottom',
    title: 'Health Advisory',
  },
  {
    target: '[data-tour="nav-tabs"]',
    content: 'Use these tabs to navigate between Home, Metrics (detailed chemical data), and Profile (your settings and preferences).',
    placement: 'bottom',
    title: 'Navigation',
  },
  {
    target: '[data-tour="report-issue"]',
    content: 'Report any water quality issues or concerns you notice. Your reports help the utility respond quickly to problems.',
    placement: 'top',
    title: 'Report Issue',
  },
  {
    target: '[data-tour="view-faq"]',
    content: 'View frequently asked questions about water safety, status levels, and how to use this dashboard.',
    placement: 'top',
    title: 'FAQ & Help',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'Get notified about critical water safety updates. You can manage notification preferences in your Profile.',
    placement: 'left',
    title: 'Notifications',
  },
];

