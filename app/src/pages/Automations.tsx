import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/Toast';

interface AutomationLog {
  id: string;
  timestamp: string;
  type: 'forecast' | 'schedule' | 'notification';
  status: 'success' | 'failure' | 'running';
  message: string;
  duration?: number;
}

interface AutomationConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  schedule: string;
}

function Automations() {
  const [automations, setAutomations] = useState<AutomationConfig[]>([
    {
      id: 'forecast',
      name: 'חישוב תחזית אוטומטי מדי לילה',
      description: 'מחשב תחזיות ביקוש אוטומטיות מדי לילה בשעה 03:00',
      enabled: true,
      lastRun: '2025-10-22T03:00:00Z',
      nextRun: '2025-10-23T03:00:00Z',
      schedule: '0 3 * * *'
    },
    {
      id: 'schedule-optimization',
      name: 'אופטימיזציה אוטומטית של סידורי עבודה',
      description: 'מעדכן אוטומטית את סידורי העבודה על בסיס תחזיות חדשות',
      enabled: false,
      lastRun: '2025-10-21T04:00:00Z',
      nextRun: '2025-10-23T04:00:00Z',
      schedule: '0 4 * * *'
    },
    {
      id: 'notifications',
      name: 'התראות יומיות למנהלים',
      description: 'שולח דוחות יומיים למנהלים על סטטוס המשמרות והתחזיות',
      enabled: true,
      lastRun: '2025-10-22T08:00:00Z',
      nextRun: '2025-10-22T08:00:00Z',
      schedule: '0 8 * * *'
    }
  ]);

  const [logs, setLogs] = useState<AutomationLog[]>([
    {
      id: '1',
      timestamp: '2025-10-22T03:00:15Z',
      type: 'forecast',
      status: 'success',
      message: 'תחזית שבועית חושבה בהצלחה עבור 168 שעות',
      duration: 15
    },
    {
      id: '2',
      timestamp: '2025-10-22T08:00:05Z',
      type: 'notification',
      status: 'success',
      message: 'דוח יומי נשלח ל-3 מנהלים',
      duration: 5
    },
    {
      id: '3',
      timestamp: '2025-10-21T03:00:30Z',
      type: 'forecast',
      status: 'success',
      message: 'תחזית שבועית חושבה בהצלחה עבור 168 שעות',
      duration: 30
    },
    {
      id: '4',
      timestamp: '2025-10-21T04:00:00Z',
      type: 'schedule',
      status: 'failure',
      message: 'כישלון באופטימיזציה - לא מצאו עובדים זמינים לשעות 22:00-06:00',
      duration: 2
    },
    {
      id: '5',
      timestamp: '2025-10-20T03:00:12Z',
      type: 'forecast',
      status: 'success',
      message: 'תחזית שבועית חושבה בהצלחה עבור 168 שעות',
      duration: 12
    }
  ]);

  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  const toggleAutomation = (id: string) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === id 
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    );
    
    const automation = automations.find(a => a.id === id);
    if (automation) {
      success(`${automation.name} ${automation.enabled ? 'הושבת' : 'הופעל'} בהצלחה`);
    }
  };

  const runNow = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (!automation) return;

    setRunningJobs(prev => new Set(prev).add(id));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add new log entry
      const newLog: AutomationLog = {
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        type: id as 'forecast' | 'schedule' | 'notification',
        status: 'success',
        message: `הרצה ידנית הושלמה בהצלחה - ${automation.name}`,
        duration: 3
      };
      
      setLogs(prev => [newLog, ...prev].slice(0, 20)); // Keep only last 20 logs
      
      // Update last run time
      setAutomations(prev => 
        prev.map(a => 
          a.id === id 
            ? { ...a, lastRun: new Date().toISOString() }
            : a
        )
      );
      
      success(`${automation.name} הורץ בהצלחה`);
    } catch (err) {
      error(`שגיאה בהרצת ${automation.name}`);
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getStatusBadge = (automation: AutomationConfig) => {
    if (!automation.enabled) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          כבוי ⏸️
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        פעיל ✅
      </span>
    );
  };

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'running':
        return '⏳';
      default:
        return '⚪';
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'forecast':
        return '🤖';
      case 'schedule':
        return '📋';
      case 'notification':
        return '📧';
      default:
        return '⚙️';
    }
  };

  const formatLastRun = (lastRun?: string) => {
    if (!lastRun) return 'אף פעם';
    
    const date = new Date(lastRun);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'לפני פחות משעה';
    } else if (diffInHours < 24) {
      return `לפני ${diffInHours} שעות`;
    } else {
      return `לפני ${Math.floor(diffInHours / 24)} ימים`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <PageHeader
        title="אוטומציות ומשימות מתוזמנות"
        description="ניהול וניטור משימות אוטומטיות, תחזיות מתוזמנות והתראות מערכת"
      />

      {/* Automation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-6">משימות אוטומטיות</h3>
          
          <div className="space-y-4">
            {automations.map((automation) => (
              <div key={automation.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={automation.id}
                        checked={automation.enabled}
                        onChange={() => toggleAutomation(automation.id)}
                        className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={automation.id} className="mr-3 text-sm font-medium text-gray-900">
                        {automation.name}
                      </label>
                    </div>
                    {getStatusBadge(automation)}
                  </div>
                  
                  <button
                    onClick={() => runNow(automation.id)}
                    disabled={runningJobs.has(automation.id) || !automation.enabled}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {runningJobs.has(automation.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        רץ כעת...
                      </>
                    ) : (
                      <>
                        ▶️
                        הרץ עכשיו
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {automation.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
                  <span>
                    <strong>עודכן לאחרונה:</strong> {formatLastRun(automation.lastRun)}
                  </span>
                  {automation.lastRun && (
                    <span className="hidden sm:inline">•</span>
                  )}
                  <span>
                    <strong>הרצה הבאה:</strong> {automation.enabled ? 'מחר 03:00' : 'כבוי'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">יומן הרצות אחרונות</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>מציג את 20 ההרצות האחרונות</span>
            <button className="text-blue-500 hover:text-blue-700">
              📥 ייצא יומן מלא
            </button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                    <span className="text-lg">{getLogStatusIcon(log.status)}</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{formatTimestamp(log.timestamp)}</span>
                      {log.duration && (
                        <>
                          <span>•</span>
                          <span>משך: {log.duration} שניות</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.status === 'success' 
                    ? 'bg-green-100 text-green-800'
                    : log.status === 'failure'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.status === 'success' ? 'הצליח' : log.status === 'failure' ? 'נכשל' : 'רץ'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין יומני הרצה</h3>
            <p className="text-gray-600">
              יומני ההרצות יופיעו כאן לאחר שהמשימות יתחילו לפעול
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Automations;
