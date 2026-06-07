"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, parse, isValid } from "date-fns";

interface DatePickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  dateFormat?: string;
  weekStart?: number;
  required?: boolean;
  className?: string;
  onChange?: (isoValue: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  name = "date",
  value,
  defaultValue = "",
  dateFormat = "MM/dd/yyyy",
  weekStart = 1,
  required = false,
  className = "",
  onChange,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for the inputs (only used when uncontrolled, or to sync typed content)
  const [localIsoValue, setLocalIsoValue] = useState(defaultValue || "");
  const [localTypedValue, setLocalTypedValue] = useState(() => {
    const initVal = value !== undefined ? value : defaultValue;
    if (initVal) {
      const parsed = new Date(initVal);
      return isNaN(parsed.getTime()) ? "" : format(parsed, dateFormat);
    }
    return "";
  });

  const [pickerMonth, setPickerMonth] = useState(() => {
    const initVal = value !== undefined ? value : defaultValue;
    if (initVal) {
      const parsed = new Date(initVal);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  
  // View states: "days" | "months" | "years"
  const [view, setView] = useState<"days" | "months" | "years">("days");
  
  // Reference year for the 12-year grid
  const [startYear, setStartYear] = useState(() => pickerMonth.getFullYear() - 5);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep track of props to detect changes during render
  const [prevValue, setPrevValue] = useState(value);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [prevDateFormat, setPrevDateFormat] = useState(dateFormat);

  // Sync state if value, defaultValue or dateFormat props change
  if (value !== prevValue || defaultValue !== prevDefaultValue || dateFormat !== prevDateFormat) {
    setPrevValue(value);
    setPrevDefaultValue(defaultValue);
    setPrevDateFormat(dateFormat);

    const activeVal = value !== undefined ? value : defaultValue;
    if (activeVal) {
      const parsed = new Date(activeVal);
      if (!isNaN(parsed.getTime())) {
        setLocalIsoValue(activeVal);
        setLocalTypedValue(format(parsed, dateFormat));
        setPickerMonth(parsed);
        setStartYear(parsed.getFullYear() - 5);
      }
    } else {
      setLocalIsoValue("");
      setLocalTypedValue("");
    }
  }

  // Derive values
  const isoValue = value !== undefined ? value : localIsoValue;
  const typedValue = localTypedValue;

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView("days");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalTypedValue(val);
    
    // Parse using the specified format
    const parsed = parse(val, dateFormat, new Date());
    if (isValid(parsed) && val.length === dateFormat.length) {
      const formattedIso = format(parsed, "yyyy-MM-dd");
      if (value === undefined) {
        setLocalIsoValue(formattedIso);
        setPickerMonth(parsed);
        setStartYear(parsed.getFullYear() - 5);
      }
      if (onChange) onChange(formattedIso);
    } else {
      if (value === undefined) {
        setLocalIsoValue("");
      }
      if (onChange) onChange("");
    }
  };

  const handleSelectDate = (date: Date) => {
    const formattedIso = format(date, "yyyy-MM-dd");
    if (value === undefined) {
      setLocalIsoValue(formattedIso);
      setLocalTypedValue(format(date, dateFormat));
    }
    setIsOpen(false);
    setView("days");
    if (onChange) onChange(formattedIso);
  };

  const pickerYear = pickerMonth.getFullYear();
  const pickerMonthNum = pickerMonth.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (view === "days") {
      setPickerMonth(new Date(pickerYear, pickerMonthNum - 1, 1));
    } else if (view === "months") {
      setPickerMonth(new Date(pickerYear - 1, pickerMonthNum, 1));
    } else if (view === "years") {
      setStartYear((prev) => prev - 12);
    }
  };

  const handleNext = () => {
    if (view === "days") {
      setPickerMonth(new Date(pickerYear, pickerMonthNum + 1, 1));
    } else if (view === "months") {
      setPickerMonth(new Date(pickerYear + 1, pickerMonthNum, 1));
    } else if (view === "years") {
      setStartYear((prev) => prev + 12);
    }
  };

  const handleHeaderClick = () => {
    if (view === "days") {
      setView("months");
    } else if (view === "months") {
      setView("years");
      setStartYear(pickerYear - 5);
    } else if (view === "years") {
      setView("days");
    }
  };

  // ── DAYS VIEW CALCULATIONS ──
  const weekdayHeaders = [];
  for (let i = 0; i < 7; i++) {
    weekdayHeaders.push(SHORT_DAYS[(weekStart + i) % 7]);
  }

  const firstDayOfMonthVal = new Date(pickerYear, pickerMonthNum, 1).getDay();
  const paddingCount = (firstDayOfMonthVal - weekStart + 7) % 7;
  const paddingCells = Array.from({ length: paddingCount }).map((_, idx) => (
    <div key={`pad-${idx}`} className="h-8 w-8" />
  ));

  const totalDaysInMonth = new Date(pickerYear, pickerMonthNum + 1, 0).getDate();
  const daysInMonthCells = Array.from({ length: totalDaysInMonth }).map((_, idx) => {
    const day = idx + 1;
    const cellDate = new Date(pickerYear, pickerMonthNum, day);
    const cellIsoStr = format(cellDate, "yyyy-MM-dd");
    const isSelected = isoValue === cellIsoStr;
    const isToday = format(new Date(), "yyyy-MM-dd") === cellIsoStr;

    return (
      <button
        key={`day-${day}`}
        type="button"
        onClick={() => handleSelectDate(cellDate)}
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
          isSelected
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : isToday
            ? "border border-indigo-500/50 text-indigo-400 bg-indigo-500/5"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {day}
      </button>
    );
  });

  // ── MONTHS VIEW CALCULATIONS ──
  const monthsCells = MONTHS.map((monthName, idx) => {
    const isSelected = pickerMonthNum === idx;
    return (
      <button
        key={monthName}
        type="button"
        onClick={() => {
          setPickerMonth(new Date(pickerYear, idx, 1));
          setView("days");
        }}
        className={`rounded-lg py-2.5 text-xs font-semibold transition-all ${
          isSelected
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {monthName.slice(0, 3)}
      </button>
    );
  });

  // ── YEARS VIEW CALCULATIONS ──
  const yearsArray: number[] = [];
  for (let i = 0; i < 12; i++) {
    yearsArray.push(startYear + i);
  }
  const yearsCells = yearsArray.map((yearNum) => {
    const isSelected = pickerYear === yearNum;
    return (
      <button
        key={yearNum}
        type="button"
        onClick={() => {
          setPickerMonth(new Date(yearNum, pickerMonthNum, 1));
          setView("months");
        }}
        className={`rounded-lg py-2.5 text-xs font-semibold transition-all ${
          isSelected
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {yearNum}
      </button>
    );
  });

  const isInputInvalid = typedValue.length > 0 && !isoValue;

  // Header Title Text
  let headerTitle = "";
  if (view === "days") {
    headerTitle = `${MONTHS[pickerMonthNum]} ${pickerYear}`;
  } else if (view === "months") {
    headerTitle = `${pickerYear}`;
  } else if (view === "years") {
    headerTitle = `${startYear} - ${startYear + 11}`;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={dateFormat.toUpperCase()}
          value={typedValue}
          onChange={handleDateTextChange}
          onFocus={() => setIsOpen(true)}
          required={required}
          className={`block w-full rounded-lg border bg-slate-950 p-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-1 ${
            isInputInvalid
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/40"
              : "border-slate-850 focus:border-indigo-500 focus:ring-indigo-500/40"
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </button>
        <input type="hidden" name={name} value={isoValue} />
      </div>

      {isInputInvalid && (
        <p className="mt-1 text-[10px] text-red-400">Please match the format: {dateFormat.toUpperCase()}</p>
      )}

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-[280px] rounded-xl border border-slate-800 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleHeaderClick}
              className="rounded-lg px-2 py-1 text-xs font-bold text-white tracking-wide uppercase hover:bg-slate-800 hover:text-indigo-400 transition-colors"
              title="Click to switch calendar view"
            >
              {headerTitle}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Render Days Grid */}
          {view === "days" && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1.5 border-b border-slate-900 mb-1.5">
                {weekdayHeaders.map((dayName, idx) => (
                  <div key={idx}>{dayName}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {paddingCells}
                {daysInMonthCells}
              </div>
            </>
          )}

          {/* Render Months Selection Grid */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {monthsCells}
            </div>
          )}

          {/* Render Years Selection Grid */}
          {view === "years" && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {yearsCells}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
