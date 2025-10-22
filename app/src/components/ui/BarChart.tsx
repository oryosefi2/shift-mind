export interface BarChartData {
  hour: string;
  demand: number;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 300, color = '#3b82f6' }: BarChartProps) {
  if (data.length === 0) return null;

  const maxDemand = Math.max(...data.map(d => d.demand));
  const chartHeight = height - 60; // Leave space for labels

  return (
    <div className="w-full relative">
      {/* Y-axis labels */}
      <div className="absolute right-0 top-0 flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none" style={{ height: `${chartHeight}px` }}>
        <span>{maxDemand}</span>
        <span>{Math.round(maxDemand * 0.75)}</span>
        <span>{Math.round(maxDemand * 0.5)}</span>
        <span>{Math.round(maxDemand * 0.25)}</span>
        <span>0</span>
      </div>
      
      <div className="flex items-end justify-between gap-1 pr-12" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = maxDemand > 0 ? (item.demand / maxDemand) * chartHeight : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 max-w-12">
              {/* Value on top of bar */}
              <div className="text-xs text-gray-600 mb-1 h-4">
                {item.demand > 0 ? item.demand : ''}
              </div>
              
              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80 relative group"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  minHeight: item.demand > 0 ? '2px' : '0px'
                }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.hour}: {item.demand} יחידות
                </div>
              </div>
              
              {/* Hour label */}
              <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center">
                {item.hour}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
