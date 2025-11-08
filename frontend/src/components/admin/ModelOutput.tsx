import './ModelOutput.css';

interface ModelOutputProps {
  anomalyScore: number;
  severityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  predictedFailurePoint: string;
  confidence: number;
  lastUpdated: string;
}

function ModelOutput({
  anomalyScore,
  severityLevel,
  predictedFailurePoint,
  confidence,
  lastUpdated,
}: ModelOutputProps) {
  return (
    <div className="model-output">
      <h3 className="model-output-title">Model Output</h3>
      <div className="model-output-content">
        <div className="output-item">
          <span className="output-label">Anomaly Score:</span>
          <span className="output-value">
            {anomalyScore.toFixed(2)}{' '}
            <span className={`severity-tag severity-${severityLevel.toLowerCase()}`}>
              ({severityLevel})
            </span>
          </span>
        </div>
        <div className="output-item">
          <span className="output-label">Predicted Failure Point:</span>
          <span className="output-value highlight">{predictedFailurePoint}</span>
        </div>
        <div className="output-item">
          <span className="output-label">Confidence:</span>
          <span className="output-value">{confidence}%</span>
        </div>
        <div className="output-item">
          <span className="output-label">Last Updated:</span>
          <span className="output-value timestamp">{lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}

export default ModelOutput;

