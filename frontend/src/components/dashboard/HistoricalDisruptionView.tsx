import React from 'react';
import { History, ShieldAlert, Activity } from 'lucide-react';
import { HistoricalTrendExplorer } from './HistoricalTrendExplorer';
import { ApiWarningBanner } from '../../context/ApiHealthContext';

export const HistoricalDisruptionView: React.FC = () => {
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Live API Health Warning Banner if BDI/Forecast APIs are degraded */}
      <ApiWarningBanner
        requiredApis={['bdi', 'forecast']}
        componentName="Historical BDI & Disruption Explorer"
      />

      {/* Main Historical Trajectory & Disruption Explorer (Clean top, zero bulky banner) */}
      <div className="id-tour-historical-header id-tour-trend-explorer">
        <HistoricalTrendExplorer />
      </div>
    </div>
  );
};

export default HistoricalDisruptionView;
