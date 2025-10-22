import React from 'react';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertsPanelProps {
  alerts: Alert[];
  title?: string;
  maxHeight?: string;
  onDismiss?: (id: string) => void;
  className?: string;
  collapsible?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  title = 'התראות ואזהרות',
  maxHeight = 'max-h-96',
  onDismiss,
  className = '',
  collapsible = true
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'error':
        return 'border-red-200/60 bg-red-50/40';
      case 'warning':
        return 'border-orange-200/60 bg-orange-50/40';
      case 'success':
        return 'border-green-200/60 bg-green-50/40';
      default:
        return 'border-blue-200/60 bg-blue-50/40';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString('he-IL');
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200/60 ${className}`} dir="rtl">
      {collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center">
              <span className="text-gray-600">🔔</span>
            </div>
            <span className="font-medium text-gray-700">{title}</span>
            <div className="w-5 h-5 rounded-full bg-orange-100/80 text-orange-600 text-xs flex items-center justify-center font-medium">
              {alerts.length}
            </div>
          </div>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <div className="w-4 h-4 text-gray-500 transition-transform flex items-center justify-center text-xs">
              ▼
            </div>
          </div>
        </button>
      ) : (
        <div className="p-4 border-b border-gray-100/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100/80 flex items-center justify-center">
              <span className="text-gray-600">🔔</span>
            </div>
            <span className="font-medium text-gray-700">{title}</span>
            <div className="w-5 h-5 rounded-full bg-orange-100/80 text-orange-600 text-xs flex items-center justify-center font-medium">
              {alerts.length}
            </div>
          </div>
        </div>
      )}
      
      {(!collapsible || isOpen) && (
        <div className={`px-4 pb-4 ${collapsible ? 'border-t border-gray-100/80 pt-4' : ''} ${maxHeight} overflow-y-auto`}>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">✨</span>
              <p>אין התראות כרגע</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {alert.message}
                      </p>
                      {alert.timestamp && (
                        <p className="text-xs text-gray-500 mb-2">
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {alert.action && (
                          <button
                            onClick={alert.action.onClick}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            {alert.action.label}
                          </button>
                        )}
                        {onDismiss && (
                          <button
                            onClick={() => onDismiss(alert.id)}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            סגור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type { Alert };
