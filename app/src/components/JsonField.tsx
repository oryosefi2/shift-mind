// Copilot: textarea that parses JSON onChange/blur, shows error if invalid, supports initial object -> pretty-printed JSON, RTL labels/messages.

import React, { useState, useEffect } from 'react';

export interface JsonFieldProps {
  label?: string;
  value?: any;
  onChange: (value: any) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  helperText?: string;
}

export function JsonField({
  label,
  value,
  onChange,
  placeholder = 'הכנס JSON תקין...',
  error,
  required = false,
  rows = 4,
  className = '',
  helperText,
}: JsonFieldProps) {
  const [textValue, setTextValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Initialize text value from prop
  useEffect(() => {
    if (value !== undefined && value !== null) {
      try {
        setTextValue(JSON.stringify(value, null, 2));
        setJsonError(null);
      } catch (e) {
        setTextValue(String(value));
        setJsonError('ערך לא תקין');
      }
    } else {
      setTextValue('');
      setJsonError(null);
    }
  }, [value]);

  const validateAndUpdate = (text: string) => {
    if (!text.trim()) {
      setJsonError(null);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onChange(parsed);
    } catch (e) {
      setJsonError('JSON לא תקין - בדוק תחביר');
      // Don't update the parent value when JSON is invalid
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    validateAndUpdate(newValue);
  };

  const handleBlur = () => {
    validateAndUpdate(textValue);
  };

  const displayError = error || jsonError;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 text-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <textarea
        value={textValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        dir="ltr" // JSON is typically LTR
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
          displayError ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      
      {helperText && !displayError && (
        <p className="text-sm text-gray-500 text-right">{helperText}</p>
      )}
      
      {displayError && (
        <p className="text-sm text-red-600 text-right">{displayError}</p>
      )}
      
      {textValue && !jsonError && (
        <p className="text-xs text-green-600 text-right">✓ JSON תקין</p>
      )}
    </div>
  );
}
