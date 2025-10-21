// Copilot: 24-hour multiplier input with sparkline preview
import React from 'react';

interface MultiHourMultiplierProps {
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  disabled?: boolean;
  className?: string;
}

export const MultiHourMultiplier: React.FC<MultiHourMultiplierProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  // Initialize 24-hour structure if empty
  const multiplierData = React.useMemo(() => {
    const data: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      data[hour] = value[hour] ?? 1.0;
    }
    return data;
  }, [value]);

  const handleHourChange = (hour: string, multiplier: number) => {
    const newData = { ...multiplierData, [hour]: multiplier };
    onChange(newData);
  };

  // Generate sparkline data for visualization
  const sparklineData = Object.keys(multiplierData)
    .sort()
    .map(hour => multiplierData[hour]);

  const maxValue = Math.max(...sparklineData, 2); // minimum scale of 2
  const minValue = Math.min(...sparklineData, 0.5); // minimum scale of 0.5

  // Generate SVG path for sparkline
  const generateSparklinePath = () => {
    const width = 200;
    const height = 40;
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((value - minValue) / (maxValue - minValue)) * height;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sparkline Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">תצוגה מקדימה של מכפילים</span>
          <div className="flex gap-2 text-xs text-gray-500">
            <span>מקס: {maxValue.toFixed(1)}</span>
            <span>מין: {minValue.toFixed(1)}</span>
          </div>
        </div>
        <svg width="200" height="40" className="w-full max-w-md" viewBox="0 0 200 40">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="200" height="40" fill="url(#grid)" />
          
          {/* Sparkline */}
          <path
            d={generateSparklinePath()}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {sparklineData.map((value, index) => {
            const x = (index / (sparklineData.length - 1)) * 200;
            const y = 40 - ((value - minValue) / (maxValue - minValue)) * 40;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3b82f6"
                opacity="0.7"
              />
            );
          })}
        </svg>
        
        {/* Hour labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {/* 24-hour grid input */}
      <div className="grid grid-cols-6 gap-2">
        {Object.keys(multiplierData).sort().map(hour => {
          const hourValue = multiplierData[hour];
          const isLow = hourValue < 0.8;
          const isHigh = hourValue > 1.5;
          
          return (
            <div key={hour} className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 text-center">
                {hour}:00
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={hourValue}
                onChange={(e) => handleHourChange(hour, parseFloat(e.target.value) || 1.0)}
                disabled={disabled}
                className={`
                  w-full px-2 py-1 text-sm border rounded-md text-center
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${isLow 
                    ? 'border-green-300 bg-green-50' 
                    : isHigh 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                  }
                `}
              />
            </div>
          );
        })}
      </div>

      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const uniform = Object.keys(multiplierData).reduce((acc, hour) => {
              acc[hour] = 1.0;
              return acc;
            }, {} as Record<string, number>);
            onChange(uniform);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          אחיד (1.0)
        </button>
        
        <button
          type="button"
          onClick={() => {
            const businessHours = Object.keys(multiplierData).reduce((acc, hour) => {
              const h = parseInt(hour);
              acc[hour] = (h >= 9 && h <= 17) ? 1.5 : 0.8;
              return acc;
            }, {} as Record<string, number>);
            onChange(businessHours);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          שעות עסקים
        </button>
        
        <button
          type="button"
          onClick={() => {
            const evening = Object.keys(multiplierData).reduce((acc, hour) => {
              const h = parseInt(hour);
              acc[hour] = (h >= 18 || h <= 2) ? 2.0 : 1.0;
              return acc;
            }, {} as Record<string, number>);
            onChange(evening);
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50"
        >
          שעות ערב
        </button>
      </div>

      {/* Summary stats */}
      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
        <span>
          ממוצע: {(Object.values(multiplierData).reduce((a, b) => a + b, 0) / 24).toFixed(2)}
        </span>
        <span>
          טווח: {minValue.toFixed(1)} - {maxValue.toFixed(1)}
        </span>
        <span>
          שעות גבוהות: {Object.values(multiplierData).filter(v => v > 1.2).length}
        </span>
      </div>
    </div>
  );
};
