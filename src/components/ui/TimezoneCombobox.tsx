// src/components/ui/TimezoneCombobox.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { timezonesData, type TimezoneEntry } from "@/lib/timezones-data";

interface TimezoneComboboxProps {
  name: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export default function TimezoneCombobox({
  name,
  defaultValue = "UTC",
  className = "",
  required = false,
  onChange,
}: TimezoneComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Update time periodically
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Sync state if default value changes
  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute timezone metadata with offsets and current local times
  const enrichedTimezones = useMemo(() => {
    const activeDate = now || new Date();
    return timezonesData.map((tz) => {
      let offset = "UTC+00:00";
      let time = "--:--";

      if (tz.tzId === "UTC") {
        offset = "UTC+00:00";
        time = activeDate.toISOString().slice(11, 16);
      } else {
        try {
          // Time
          const timeFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: tz.tzId,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          time = timeFormatter.format(activeDate);

          // Offset
          const offsetFormatter = new Intl.DateTimeFormat("en-US", {
            timeZone: tz.tzId,
            timeZoneName: "longOffset",
          });
          const parts = offsetFormatter.formatToParts(activeDate);
          const tzPart = parts.find((p) => p.type === "timeZoneName");
          offset = tzPart ? tzPart.value.replace("GMT", "UTC") : "UTC+00:00";
        } catch (e) {
          // Fallback if IANA timezone is not supported by browser
        }
      }

      return {
        ...tz,
        offset,
        time,
      };
    });
  }, [now]);

  // Handle auto-detection of browser timezone
  useEffect(() => {
    if (!defaultValue || defaultValue === "UTC") {
      try {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTz) {
          // Check if it exists in our list, otherwise add it
          const exists = timezonesData.some((tz) => tz.tzId === detectedTz);
          if (exists) {
            setSelectedValue(detectedTz);
            if (onChange) onChange(detectedTz);
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }, [defaultValue, onChange]);

  // Selected item reference
  const selectedItem = useMemo(() => {
    return enrichedTimezones.find((tz) => tz.tzId === selectedValue) || enrichedTimezones[0];
  }, [selectedValue, enrichedTimezones]);

  // Filtered timezone list based on query
  const filteredTimezones = useMemo(() => {
    if (!search.trim()) return enrichedTimezones;
    const cleanSearch = search.toLowerCase();
    return enrichedTimezones.filter(
      (tz) =>
        tz.country.toLowerCase().includes(cleanSearch) ||
        tz.capital.toLowerCase().includes(cleanSearch) ||
        tz.tzId.toLowerCase().includes(cleanSearch)
    );
  }, [search, enrichedTimezones]);

  const handleSelect = (tzId: string) => {
    setSelectedValue(tzId);
    setIsOpen(false);
    setSearch("");
    if (onChange) {
      onChange(tzId);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden Form Input */}
      <input type="hidden" name={name} value={selectedValue} required={required} />

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-left text-sm text-white transition-all hover:border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
      >
        <span className="truncate">
          {selectedItem ? (
            <>
              <span className="font-semibold">{selectedItem.capital}</span>{" "}
              <span className="text-slate-400">({selectedItem.country})</span>
              <span className="mx-2 text-slate-500">•</span>
              <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                {selectedItem.time}
              </span>
              <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                {selectedItem.offset}
              </span>
            </>
          ) : (
            "Select Timezone..."
          )}
        </span>
        <svg
          className={`ml-2 h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute z-50 bottom-full mb-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-100">
          {/* Search Box */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-3 py-2">
            <svg className="mr-2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.636Z" />
            </svg>
            <input
              type="text"
              placeholder="Search country, capital, or timezone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-full p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* List options */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-slate-900">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((tz) => {
                const isSelected = tz.tzId === selectedValue;
                return (
                  <button
                    key={`${tz.country}-${tz.capital}-${tz.tzId}`}
                    type="button"
                    onClick={() => handleSelect(tz.tzId)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-800/80 ${
                      isSelected ? "bg-indigo-950/40 text-indigo-400" : "text-slate-300"
                    }`}
                  >
                    <div className="truncate pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{tz.capital}</span>
                        <span className="text-[11px] text-slate-500">({tz.country})</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500 truncate">{tz.tzId}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-white">{tz.time}</div>
                        <div className="font-mono text-[9px] text-slate-500">{tz.offset}</div>
                      </div>
                      {isSelected && (
                        <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No matching capitals or timezones found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
