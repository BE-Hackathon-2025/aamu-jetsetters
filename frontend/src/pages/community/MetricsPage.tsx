import { useState, useRef, useEffect } from 'react';
import RiskIndexCard from '../../components/community/RiskIndexCard';
import ChemicalParameters from '../../components/community/ChemicalParameters';
import HistoricalTrends from '../../components/common/HistoricalTrends';
import { useRiskIndex } from '../../hooks/useRiskIndex';
import { useChemicals } from '../../hooks/useChemicals';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { mapRiskLevelToRiskIndexCard, mapStatusToFrontend, getChemicalIcon } from '../../utils/dataMapper';
import './MetricsPage.css';

function MetricsPage() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const scrollPositionRef = useRef<number>(0);
  const isChangingRangeRef = useRef<boolean>(false);
  const { data: riskIndex, loading: riskLoading } = useRiskIndex();
  const { data: chemicals, loading: chemicalsLoading } = useChemicals();
  const { riskIndexTrend, chemicalTrends, loading: historyLoading } = useHistoricalData(timeRange);

  const chlorineTrend = chemicalTrends.chlorine || [];

  const mappedChemicals = chemicals?.map((chem) => ({
    id: chem.parameter,
    name: chem.displayName,
    value: chem.value.split(' ')[0],
    unit: chem.value.split(' ').slice(1).join(' '),
    status: mapStatusToFrontend(chem.status),
    icon: getChemicalIcon(chem.parameter),
  })) || [];

  useEffect(() => {
    if (isChangingRangeRef.current && !historyLoading) {
      const restoreScroll = () => {
        const targetScroll = scrollPositionRef.current;
        window.scrollTo(0, targetScroll);
        
        setTimeout(() => {
          if (Math.abs(window.scrollY - targetScroll) > 5) {
            window.scrollTo(0, targetScroll);
          }
          isChangingRangeRef.current = false;
        }, 50);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(restoreScroll);
        });
      });
    }
  }, [historyLoading, riskIndexTrend, chlorineTrend]);

  const handleTimeRangeChange = (range: '7days' | '30days' | '90days') => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    isChangingRangeRef.current = true;
    
    const rangeMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
    };
    
    setTimeRange(rangeMap[range] as 7 | 30 | 90);
  };

  if (riskLoading || chemicalsLoading || historyLoading) {
    return (
      <div className="metrics-page">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a0a0' }}>
          Loading metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-page">
      {riskIndex && (
        <div className="metrics-section">
          <RiskIndexCard
            percentage={Math.round(riskIndex.index)}
            riskLevel={mapRiskLevelToRiskIndexCard(riskIndex.level)}
            description={riskIndex.description}
          />
        </div>
      )}

      <div className="metrics-section">
        <HistoricalTrends
          title="Risk Index Trend"
          data={riskIndexTrend}
          timeRange={`${timeRange}days` as '7days' | '30days' | '90days'}
          unit="%"
          variant="community"
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      <div className="metrics-section">
        <ChemicalParameters parameters={mappedChemicals} />
      </div>

      <div className="metrics-section">
        <HistoricalTrends
          title="Chlorine Residual Trend"
          data={chlorineTrend}
          timeRange={`${timeRange}days` as '7days' | '30days' | '90days'}
          unit="mg/L"
          variant="community"
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>
    </div>
  );
}

export default MetricsPage;

