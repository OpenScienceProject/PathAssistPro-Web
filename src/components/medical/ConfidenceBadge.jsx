import React from 'react';

const ConfidenceBadge = ({ level, sources = [] }) => {
  const configs = {
    high: { 
      color: 'green', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      icon: '✓', 
      label: 'Fiable',
      description: '≥2 sources concordantes'
    },
    medium: { 
      color: 'orange', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      icon: '⚠', 
      label: 'Modéré',
      description: '1 source fiable'
    },
    low: { 
      color: 'red', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      icon: '!', 
      label: 'Incertain',
      description: 'Info extrapolée ou incomplète'
    },
    none: { 
      color: 'gray', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      icon: '?', 
      label: 'Non vérifié',
      description: 'Pas d\'information dans les sources'
    }
  };
  
  const config = configs[level] || configs.none;
  
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-3 py-1 ${config.bgColor} ${config.textColor} rounded-full text-xs font-semibold border-2 ${config.borderColor}`} title={config.description}>
        <span className="text-sm">{config.icon}</span>
        {config.label}
      </span>
      {sources && sources.length > 0 && (
        <span className="text-xs text-gray-500">
          ({sources.length} source{sources.length > 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default ConfidenceBadge;
