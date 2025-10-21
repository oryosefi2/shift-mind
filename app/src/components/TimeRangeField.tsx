// Copilot: two <input type="time"> for start/end with RTL layout, validates not equal, allows cross-midnight (start > end) and shows a small warning text.

export interface TimeRangeFieldProps {
  label?: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startError?: string;
  endError?: string;
  required?: boolean;
  className?: string;
  helperText?: string;
}

export function TimeRangeField({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startError,
  endError,
  required = false,
  className = '',
  helperText,
}: TimeRangeFieldProps) {
  const isCrossMidnight = startTime && endTime && startTime > endTime;
  const isEqual = startTime && endTime && startTime === endTime;
  
  const hasError = startError || endError || isEqual;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="grid grid-cols-2 gap-4" dir="rtl">
        {/* End Time - shows first in RTL */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-right">
            שעת סיום
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
              endError || isEqual ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        
        {/* Start Time - shows second in RTL */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-right">
            שעת התחלה
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
              startError || isEqual ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
      </div>
      
      {/* Validation Messages */}
      {isEqual && (
        <p className="text-sm text-red-600 text-right">
          שעת התחלה ושעת הסיום לא יכולות להיות זהות
        </p>
      )}
      
      {isCrossMidnight && !isEqual && (
        <p className="text-sm text-yellow-600 text-right">
          ⚠️ משמרת חוצה חצות (מאושר)
        </p>
      )}
      
      {startError && (
        <p className="text-sm text-red-600 text-right">{startError}</p>
      )}
      
      {endError && (
        <p className="text-sm text-red-600 text-right">{endError}</p>
      )}
      
      {helperText && !hasError && !isCrossMidnight && (
        <p className="text-sm text-gray-500 text-right">{helperText}</p>
      )}
    </div>
  );
}
