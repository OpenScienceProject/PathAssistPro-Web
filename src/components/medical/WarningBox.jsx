import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const WarningBox = ({ message, type = 'warning' }) => {
  const configs = {
    warning: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />
    }
  };
  
  const config = configs[type] || configs.warning;
  
  return (
    <div className={`mt-3 p-4 ${config.bgColor} border-l-4 ${config.borderColor} rounded-r-lg`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <p className={`text-sm ${config.textColor} leading-relaxed`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default WarningBox;
