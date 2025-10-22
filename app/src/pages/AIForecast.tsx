import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataCard } from '../components/ui/DataCard';
import { BarChart } from '../components/ui/BarChart';
import { useToast } from '../components/Toast';

interface ForecastData {
  date: string;
  hour: number;
  demand: number;
  confidence: number;
}

interface WeekSummary {
  totalDemand: number;
  averageConfidence: number;
  peakHour: number;
  peakDemand: number;
  lowHour: number;
  lowDemand: number;
}

function AIForecast() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isCalculating, setIsCalculating] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);
  
  const { success } = useToast();

  // Generate mock forecast data
  const generateForecast = async () => {
    setIsCalculating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockData: ForecastData[] = [];
    const startDate = new Date(selectedWeek);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Get start of week
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + day);
        
        // Generate realistic demand patterns
        let baseDemand = 20;
        if (day >= 1 && day <= 5) { // Weekdays
          if (hour >= 8 && hour <= 17) baseDemand = 40; // Business hours
          if (hour >= 12 && hour <= 14) baseDemand = 60; // Lunch peak
        } else { // Weekends
          if (hour >= 10 && hour <= 22) baseDemand = 35; // Weekend activity
        }
        
        // Add some randomness
        const demand = Math.max(5, baseDemand + Math.random() * 20 - 10);
        const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          hour,
          demand: Math.round(demand),
          confidence: Math.round(confidence * 100)
        });
      }
    }
    
    // Calculate week summary
    const totalDemand = mockData.reduce((sum, item) => sum + item.demand, 0);
    const averageConfidence = Math.round(
      mockData.reduce((sum, item) => sum + item.confidence, 0) / mockData.length
    );
    
    const peakItem = mockData.reduce((max, item) => 
      item.demand > max.demand ? item : max
    );
    const lowItem = mockData.reduce((min, item) => 
      item.demand < min.demand ? item : min
    );
    
    const summary: WeekSummary = {
      totalDemand,
      averageConfidence,
      peakHour: peakItem.hour,
      peakDemand: peakItem.demand,
      lowHour: lowItem.hour,
      lowDemand: lowItem.demand
    };
    
    setForecastData(mockData);
    setWeekSummary(summary);
    setIsCalculating(false);
    success('תחזית נשמרה בהצלחה');
  };

  const createAutoSchedule = () => {
    success('סידור אוטומטי נוצר בהצלחה על בסיס התחזית');
  };

  // Prepare data for daily forecast table
  const dailyForecast = forecastData.length > 0 ? Array.from({ length: 7 }, (_, dayIndex) => {
    const dayData = forecastData.filter((_, index) => Math.floor(index / 24) === dayIndex);
    const date = dayData[0]?.date || '';
    const totalDemand = dayData.reduce((sum, item) => sum + item.demand, 0);
    const avgConfidence = Math.round(
      dayData.reduce((sum, item) => sum + item.confidence, 0) / dayData.length
    );
    
    return {
      id: dayIndex.toString(),
      date,
      day: new Date(date).toLocaleDateString('he-IL', { weekday: 'long' }),
      totalDemand,
      avgConfidence,
      peakHour: dayData.reduce((max, item) => item.demand > max.demand ? item : max).hour,
    };
  }) : [];

  // Prepare data for hourly bar chart
  const hourlyChartData = forecastData.length > 0 ? 
    Array.from({ length: 24 }, (_, hour) => {
      const hourData = forecastData.filter(item => item.hour === hour);
      const avgDemand = hourData.reduce((sum, item) => sum + item.demand, 0) / hourData.length;
      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        demand: Math.round(avgDemand || 0)
      };
    }) : [];

  const dailyColumns = [
    { key: 'day' as const, label: 'יום' },
    { key: 'date' as const, label: 'תאריך' },
    { key: 'totalDemand' as const, label: 'סה"כ ביקוש' },
    { 
      key: 'avgConfidence' as const, 
      label: 'רמת ביטחון',
      render: (value: number) => `${value}%`
    },
    { 
      key: 'peakHour' as const, 
      label: 'שעת שיא',
      render: (value: number) => `${String(value).padStart(2, '0')}:00`
    },
  ];

  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('he-IL')} - ${endOfWeek.toLocaleDateString('he-IL')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <PageHeader
        title="תחזית AI"
        description="תחזית ביקוש חכמה על בסיס נתונים היסטוריים ואלגוריתמי למידת מכונה"
      />

      {/* Week Selector & Calculate Button */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר שבוע לתחזית
              </label>
              <input
                type="date"
                value={selectedWeek.toISOString().split('T')[0]}
                onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2 sm:mt-6">
              <div className="text-sm text-gray-600">
                טווח: {getWeekRange(selectedWeek)}
              </div>
            </div>
          </div>
          
          <button
            onClick={generateForecast}
            disabled={isCalculating}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                מחשב תחזית...
              </>
            ) : (
              'חשב תחזית'
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {weekSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה"כ ביקוש שבועי</p>
                <p className="text-2xl font-bold text-blue-600">{weekSummary.totalDemand}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">רמת ביטחון ממוצעת</p>
                <p className="text-2xl font-bold text-green-600">{weekSummary.averageConfidence}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">שעת שיא</p>
                <p className="text-2xl font-bold text-orange-600">
                  {String(weekSummary.peakHour).padStart(2, '0')}:00
                </p>
                <p className="text-sm text-gray-500">{weekSummary.peakDemand} יחידות</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">שעת שפל</p>
                <p className="text-2xl font-bold text-blue-600">
                  {String(weekSummary.lowHour).padStart(2, '0')}:00
                </p>
                <p className="text-sm text-gray-500">{weekSummary.lowDemand} יחידות</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m0 0l6-6m-6 6l6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Demand Chart */}
      {hourlyChartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">גרף ביקוש שעתי ממוצע</h3>
          <BarChart data={hourlyChartData} />
        </div>
      )}

      {/* Daily Forecast Table */}
      {dailyForecast.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">תחזית יומית</h3>
            <button
              onClick={createAutoSchedule}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              צור סידור אוטומטי
            </button>
          </div>
          
          <DataCard
            data={dailyForecast}
            columns={dailyColumns}
            searchPlaceholder="חיפוש תחזית..."
          />
        </>
      )}

      {/* Empty State */}
      {forecastData.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין נתוני תחזית</h3>
          <p className="text-gray-600 mb-4">
            בחר שבוע ולחץ על "חשב תחזית" כדי ליצור תחזית ביקוש חכמה
          </p>
        </div>
      )}
    </div>
  );
}

export default AIForecast;
