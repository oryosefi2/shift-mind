interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            {/* Step Circle */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm
              ${index < currentStep 
                ? 'bg-green-500 border-green-500 text-white' 
                : index === currentStep
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-400'
              }
            `}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            
            {/* Step Label */}
            <span className={`
              mr-3 text-sm font-medium
              ${index <= currentStep ? 'text-gray-800' : 'text-gray-400'}
            `}>
              {step}
            </span>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-4
                ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
