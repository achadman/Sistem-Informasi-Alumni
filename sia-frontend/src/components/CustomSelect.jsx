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
        className="w-full input-warm flex items-center justify-between font-medium cursor-pointer"
      >
        <span className={value ? 'text-primary' : 'text-secondary opacity-70'}>{selectedLabel}</span>
        <ChevronDown size={16} className={`text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-elevated border border-border-subtle rounded-xl shadow-premium max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 py-2">
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
                  isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'text-secondary hover:text-primary hover:bg-surface'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && <Check size={16} className="text-brand-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
