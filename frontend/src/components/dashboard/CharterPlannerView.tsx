import React from 'react';
import { VesselOptimizer } from './VesselOptimizer';
import { ApiWarningBanner } from '../../context/ApiHealthContext';

export const CharterPlannerView: React.FC = () => {
  return (
    <div className="w-full">
      {/* Live API Health Warning Banner if Vessels/Ports APIs are degraded */}
      <ApiWarningBanner
        requiredApis={['vessels', 'ports']}
        componentName="Charter Planner & Hydrodynamics Optimizer"
      />
      <VesselOptimizer />
    </div>
  );
};

export default CharterPlannerView;
