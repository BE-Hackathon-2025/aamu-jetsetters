import './ChartWidget.css';
import type { SensorDataPoint } from '../../services/adminApi';

interface ChartWidgetProps {
  title?: string;
  showLiveBadge?: boolean;
  sensorData?: SensorDataPoint[];
  loading?: boolean;
}

function ChartWidget({ 
  title = 'Multi-Series Sensor Data with Anomaly Score', 
  showLiveBadge = true
}: ChartWidgetProps) {
  return (
    <div className="chart-widget">
      <div className="chart-widget-header">
        <h3 className="chart-widget-title">{title}</h3>
        {showLiveBadge && <span className="live-badge">Live Data</span>}
      </div>
      <div className="chart-placeholder">
        <div className="chart-axes">
          <div className="y-axis-left">
            <span>PSI/L/CFS</span>
            <div className="axis-labels">
              <span>101</span>
              <span>60</span>
              <span>30</span>
              <span>0</span>
            </div>
          </div>
          <div className="chart-content">
            {/* Placeholder for chart implementation */}
            <div className="chart-visual">
              <svg width="100%" height="100%" viewBox="0 0 600 200">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="#2a2a2a" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#2a2a2a" strokeWidth="1" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#2a2a2a" strokeWidth="1" />
                
                {/* Sample lines */}
                <polyline points="0,120 100,100 200,80 300,90 400,70 500,85 600,75" fill="none" stroke="#a78bfa" strokeWidth="2" />
                <polyline points="0,140 100,135 200,145 300,130 400,125 500,140 600,135" fill="none" stroke="#14b8a6" strokeWidth="2" />
                <polyline points="0,110 100,115 200,105 300,120 400,100 500,110 600,105" fill="none" stroke="#ef4444" strokeWidth="2" />
                <polygon points="0,200 100,180 200,160 300,170 400,150 500,165 600,155 600,200" fill="rgba(251, 191, 36, 0.2)" />
                <polyline points="0,200 100,180 200,160 300,170 400,150 500,165 600,155" fill="none" stroke="#fbbf24" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <div className="y-axis-right">
            <span>%</span>
            <div className="axis-labels">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
          </div>
        </div>
        <div className="x-axis">
          <span>06:10 PM</span>
          <span>06:25 PM</span>
          <span>06:40 PM</span>
          <span>06:55 PM</span>
          <span>07:10 PM</span>
          <span>07:25 PM</span>
          <span>07:40 PM</span>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#a78bfa' }}></span>
            <span>Level T1</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#14b8a6' }}></span>
            <span>Flow PU1</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Pressure J14</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#fbbf24' }}></span>
            <span>Anomaly Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartWidget;

