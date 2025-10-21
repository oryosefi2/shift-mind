// Copilot: label + children + helper + error message RTL-friendly wrapper for React Hook Form.

export interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  children,
  error,
  helperText,
  required = false,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div>
        {children}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 text-right">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 text-right">{helperText}</p>
      )}
    </div>
  );
}
