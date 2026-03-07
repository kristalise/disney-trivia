'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SearchAutocompleteProps {
  id: string;
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: boolean;
  maxSuggestions?: number;
  minChars?: number;
}

const DEFAULT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent';

export default function SearchAutocomplete({
  id,
  suggestions,
  value,
  onChange,
  placeholder,
  className,
  icon = false,
  maxSuggestions = 6,
  minChars = 2,
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    value.length >= minChars
      ? suggestions
          .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
          .slice(0, maxSuggestions)
      : [];

  const showDropdown = open && filtered.length > 0;

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        select(filtered[activeIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [showDropdown, filtered, activeIndex, select],
  );

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const highlight = (text: string) => {
    const idx = text.toLowerCase().indexOf(value.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold">{text.slice(idx, idx + value.length)}</span>
        {text.slice(idx + value.length)}
      </>
    );
  };

  const listboxId = `${id}-listbox`;

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{placeholder || 'Search'}</label>
      {icon && (
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className || DEFAULT_CLASS}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
      />
      {showDropdown && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg"
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              className={`min-h-[44px] flex items-center px-4 py-2 text-sm cursor-pointer ${
                i === activeIndex
                  ? 'bg-disney-blue/10 dark:bg-disney-gold/10 text-disney-blue dark:text-disney-gold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {highlight(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
