import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ChevronDown, X } from 'lucide-react';
import { cn } from './ui/utils';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  categories?: string[];
  placeholder?: string;
}

export function CategoryInput({ 
  value, 
  onChange, 
  categories = ['Feature', 'Enhancement', 'Integration', 'Performance', 'Security', 'UX/UI'],
  placeholder = "Select from list or type custom category"
}: CategoryInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue && !categories.includes(inputValue)) {
        // Custom value - just close the dropdown, value is already set
        setIsOpen(false);
      } else if (inputValue && categories.includes(inputValue)) {
        // Suggested value - close dropdown
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectCategory = (category: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setInputValue(category);
    onChange(category);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row items-center justify-end gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-1">
            {inputValue && !categories.includes(inputValue) && (
              <>
                <div className="px-3 py-1 text-xs text-gray-500">Custom Category</div>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-blue-50 rounded-sm hover:bg-blue-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                >
                  "{inputValue}" (Custom)
                </button>
                {categories.length > 0 && <div className="border-t my-1"></div>}
              </>
            )}
            {categories.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs text-gray-500">Suggested Values</div>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-sm hover:bg-gray-100 transition-colors",
                      inputValue === category && "bg-gray-100"
                    )}
                    onClick={(e) => handleSelectCategory(category, e)}
                  >
                    {category}
                  </button>
                ))}
              </>
            )}
            {!inputValue && categories.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                Type to enter a custom category
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

