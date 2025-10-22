interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  color?: 'blue' | 'orange' | 'green';
}

export function Slider({ label, value, min, max, step, onChange, color = 'blue' }: SliderProps) {


  const getTrackColor = () => {
    switch (color) {
      case 'orange':
        return 'bg-orange-100';
      case 'green':
        return 'bg-green-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
          {value.toFixed(1)}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`
            w-full h-2 rounded-lg appearance-none cursor-pointer
            ${getTrackColor()}
            slider-thumb-${color}
          `}
          style={{
            background: `linear-gradient(to right, ${
              color === 'orange' ? '#f97316' : 
              color === 'green' ? '#22c55e' : '#3b82f6'
            } 0%, ${
              color === 'orange' ? '#f97316' : 
              color === 'green' ? '#22c55e' : '#3b82f6'
            } ${((value - min) / (max - min)) * 100}%, ${
              color === 'orange' ? '#fed7aa' : 
              color === 'green' ? '#bbf7d0' : '#dbeafe'
            } ${((value - min) / (max - min)) * 100}%, ${
              color === 'orange' ? '#fed7aa' : 
              color === 'green' ? '#bbf7d0' : '#dbeafe'
            } 100%)`
          }}
        />
      </div>
    </div>
  );
}
