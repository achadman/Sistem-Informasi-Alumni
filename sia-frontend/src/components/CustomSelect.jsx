import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  name, 
  value, 
  onChange, 
  options, 
  placeholder = "Pilih opsi...",
  disabled = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedLabel = options.find(o => (o.value || o) === value)?.label || 
                        options.find(o => (o.value || o) === value)?.value || 
                        value || placeholder;

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all flex items-center justify-between text-sm font-medium"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{selectedLabel}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-2">
          {options.map((opt, idx) => {
            const isObj = typeof opt === 'object';
            const optValue = isObj ? opt.value : opt;
            const optLabel = isObj ? opt.label : opt;
            const isSelected = optValue === value;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(optValue)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between text-sm font-bold group ${
                  isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && <Check size={16} className="text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
