'use client';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SlashCommandItem } from './SlashCommandExtension';

type Props = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

const SlashCommandMenu = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setSelectedIndex(0); }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-border bg-white shadow-lg p-1">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          블록 유형
        </p>
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => command(item)}
            className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-blue-50 text-[#0054FF]'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-white text-xs font-bold text-gray-600">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-medium leading-none">{item.title}</p>
              <p className="mt-0.5 text-xs text-gray-400">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';
export default SlashCommandMenu;
