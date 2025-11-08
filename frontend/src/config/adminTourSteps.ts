import type { Step } from 'react-joyride';

export const adminTourSteps: Step[] = [
  {
    target: '[data-tour="sidebar"]',
    content: 'Use the sidebar to navigate between different sections: Anomaly Overview, Diagnostics & Forensics, AI Analyst, and Community Reports.',
    placement: 'right',
    title: 'Navigation Sidebar',
    disableBeacon: true,
  },
  {
    target: '[data-tour="data-cards"]',
    content: 'Monitor key system metrics at a glance: System Status, Water Quality Index, Pump Flow Rate, and Tank Levels. These update in real-time.',
    placement: 'bottom',
    title: 'System Metrics',
  },
  {
    target: '[data-tour="alerts"]',
    content: 'View active security alerts and system warnings. Critical alerts require immediate attention.',
    placement: 'top',
    title: 'Active Alerts',
  },
  {
    target: '[data-tour="network-health"]',
    content: 'Monitor network health, traffic volume, and failed connections to detect potential cyber threats.',
    placement: 'left',
    title: 'Network Health',
  },
  {
    target: '[data-tour="anomaly-trend"]',
    content: 'Track anomaly scores over time. Use the time range selector (7/30/90 days) to analyze trends and detect patterns.',
    placement: 'top',
    title: 'Anomaly Score Trend',
  },
  {
    target: '[data-tour="incidents"]',
    content: 'Review recent security incidents and their resolution status. Active incidents are highlighted for priority attention.',
    placement: 'top',
    title: 'Recent Incidents',
  },
];

