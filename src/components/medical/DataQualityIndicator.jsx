import React from 'react';
import { Shield } from 'lucide-react';

const DataQualityIndicator = ({ quality, missingInfo = [] }) => {
  const configs = {
    excellent: { color: 'green', label: 'Excellente', percentage: 95 },
    good: { color: 'blue', label: 'Bonne', percentage: 75 },
    fair: { color: 'orange', label: 'Acceptable', percentage: 50 },
    poor: { color: 'red', label: 'Insuffisante', percentage: 25 }
  };
  
  const config = configs[quality] || configs.fair;
  
  return (
    <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Qualité des Données
        </h4>
        <span className={`px-3 py-1 bg-${config.color}-100 text-${config.color}-700 rounded-full text-xs font-semibold`}>
          {config.label}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`bg-${config.color}-500 h-2 rounded-full transition-all`}
          style={{ width: `${config.percentage}%` }}
        ></div>
      </div>
      
      {missingInfo && missingInfo.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Informations manquantes :</p>
          <ul className="space-y-1">
            {missingInfo.map((item, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataQualityIndicator;
