import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function SelectDropdown({ 
  options = [], // [{ value: 'id', label: 'Nama' }] or ['String1', 'String2']
  value, 
  onChange, 
  placeholder = "Pilih opsi...",
  icon: Icon,
  disabled = false
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

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // Find selected label
  let selectedLabel = "";
  if (value) {
    const selectedOption = options.find(opt => 
      typeof opt === 'object' ? opt.value === value : opt === value
    );
    if (selectedOption) {
      selectedLabel = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
    }
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full text-left py-3.5 ${Icon ? 'pl-11' : 'pl-4'} pr-10 bg-surface border ${isOpen ? 'border-brand-primary/40 ring-4 ring-brand-primary/10' : 'border-border-subtle hover:border-brand-primary/40'} rounded-2xl transition-all text-sm font-bold flex items-center ${disabled ? 'opacity-50' : ''}`}
      >
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-60 shrink-0" size={18} />}
        
        <span className={`truncate block w-full ${selectedLabel ? 'text-primary' : 'text-secondary'}`}>
          {selectedLabel || placeholder}
        </span>
        
        <ChevronDown 
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-secondary transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          size={16} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-elevated border border-border-subtle rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          {options.length === 0 ? (
            <div className="p-4 text-center text-sm text-secondary opacity-60">
              Tidak ada opsi
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full px-4 py-3 text-left hover:bg-main transition-colors border-b border-border-subtle last:border-b-0 text-sm font-bold text-secondary italic"
              >
                Reset / Semua
              </button>
              {options.map((item, index) => {
                const optValue = typeof item === 'object' ? item.value : item;
                const optLabel = typeof item === 'object' ? item.label : item;
                const isSelected = value === optValue;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(optValue)}
                    className="w-full px-4 py-3 text-left hover:bg-main transition-colors flex items-center justify-between border-b border-border-subtle last:border-b-0 group"
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-brand-primary' : 'text-primary group-hover:text-brand-primary'} transition-colors`}>
                      {optLabel}
                    </span>
                    {isSelected && <Check size={16} className="text-brand-primary" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
