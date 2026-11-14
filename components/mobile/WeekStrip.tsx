import React from 'react';
import { currentWeek, localIso, type WeekDay } from '../../lib/weekStrip';

interface WeekStripProps {
  now?: Date;
  selectedIso: string | null;
  onSelect: (iso: string | null) => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({ now = new Date(), selectedIso, onSelect }) => {
  const days: WeekDay[] = currentWeek(now);
  const today = localIso(now);

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Semana">
      {days.map((day) => {
        const selected = selectedIso === day.iso;
        return (
          <button
            key={day.iso}
            type="button"
            onClick={() => onSelect(selected ? null : day.iso)}
            className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-shell border text-m-sm ${
              selected
                ? 'border-terreta-accent bg-terreta-accent text-white'
                : 'border-terreta-border bg-terreta-card text-terreta-dark'
            }`}
            aria-pressed={selected}
          >
            <span>{day.label}</span>
            <span className="text-m-base">{day.dayNumber}</span>
            {day.iso === today ? <span className="text-[10px] leading-none">hoy</span> : null}
          </button>
        );
      })}
    </div>
  );
};
