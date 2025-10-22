import React from 'react';

interface BudgetBarProps {
  current: number;
  total: number;
  currency?: string;
  showPercentage?: boolean;
  className?: string;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({
  current,
  total,
  currency = '₪',
  showPercentage = true,
  className = ''
}) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  const getBarColor = () => {
    if (percentage <= 80) return 'bg-green-500';
    if (percentage <= 95) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage <= 80) return 'text-green-600';
    if (percentage <= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 ${className}`} dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center">
            <span className="text-gray-600">💰</span>
          </div>
          <span className="font-medium text-gray-700">תקציב</span>
        </div>
        <div className={`text-lg font-semibold ${getTextColor()}`}>
          {currency}{current.toLocaleString()} / {currency}{total.toLocaleString()}
        </div>
      </div>
      
      <div className="w-full bg-gray-200/70 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        {showPercentage && <span>{percentage.toFixed(1)}% מהתקציב</span>}
        <span>נותרו: {currency}{(total - current).toLocaleString()}</span>
      </div>
    </div>
  );
};
