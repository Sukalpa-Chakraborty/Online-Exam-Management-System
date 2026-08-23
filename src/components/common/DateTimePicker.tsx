import { useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";

interface DateTimePickerProps {
  label: string;
  value: string; // Expected format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  required?: boolean;
  minDate?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateTimePicker({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Select date & time",
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value or fallback to now
  const parseValue = () => {
    if (!value) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: now.getHours() % 12 || 12,
        minute: Math.floor(now.getMinutes() / 5) * 5,
        period: now.getHours() >= 12 ? "PM" : "AM",
        hasValue: false,
      };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: 12,
        minute: 0,
        period: "PM",
        hasValue: false,
      };
    }

    const hours24 = date.getHours();
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: hours24 % 12 || 12,
      minute: date.getMinutes(),
      period: hours24 >= 12 ? "PM" : "AM",
      hasValue: true,
    };
  };

  const parsed = parseValue();
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(
    parsed.period as "AM" | "PM"
  );

  // Sync internal state when prop value changes
  useEffect(() => {
    const p = parseValue();
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDay(p.day);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period as "AM" | "PM");
    setViewYear(p.year);
    setViewMonth(p.month);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Construct ISO datetime string (YYYY-MM-DDTHH:mm)
  const emitValue = (
    y: number,
    m: number,
    d: number,
    h: number,
    min: number,
    p: "AM" | "PM"
  ) => {
    let hours24 = h % 12;
    if (p === "PM") hours24 += 12;

    const formattedYear = String(y).padStart(4, "0");
    const formattedMonth = String(m + 1).padStart(2, "0");
    const formattedDay = String(d).padStart(2, "0");
    const formattedHour = String(hours24).padStart(2, "0");
    const formattedMin = String(min).padStart(2, "0");

    const isoString = `${formattedYear}-${formattedMonth}-${formattedDay}T${formattedHour}:${formattedMin}`;
    onChange(isoString);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
    emitValue(
      viewYear,
      viewMonth,
      day,
      selectedHour,
      selectedMinute,
      selectedPeriod
    );
  };

  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour);
    emitValue(
      selectedYear,
      selectedMonth,
      selectedDay,
      newHour,
      selectedMinute,
      selectedPeriod
    );
  };

  const handleMinuteChange = (newMinute: number) => {
    setSelectedMinute(newMinute);
    emitValue(
      selectedYear,
      selectedMonth,
      selectedDay,
      selectedHour,
      newMinute,
      selectedPeriod
    );
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setSelectedPeriod(newPeriod);
    emitValue(
      selectedYear,
      selectedMonth,
      selectedDay,
      selectedHour,
      selectedMinute,
      newPeriod
    );
  };

  const handleSetToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    setViewYear(y);
    setViewMonth(m);
    emitValue(y, m, d, selectedHour, selectedMinute, selectedPeriod);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  // Calendar days generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const formattedDisplay = () => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen(!isOpen);
        }}
        className={`flex w-full items-center justify-between rounded-xl border bg-white dark:bg-slate-900 py-2.5 px-3.5 text-xs transition cursor-pointer select-none ${
          isOpen
            ? "border-blue-500 ring-4 ring-blue-500/10 dark:ring-blue-500/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
          <span
            className={`truncate font-medium ${
              formattedDisplay()
                ? "text-slate-900 dark:text-white font-semibold"
                : "text-slate-400"
            }`}
          >
            {formattedDisplay() || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              title="Clear date"
            >
              <X size={14} />
            </button>
          )}
          <Clock size={15} />
        </div>
      </div>

      {/* Modern Popover Modal */}
      {isOpen && (
        <div className="app-popover absolute left-0 top-full z-50 mt-2 w-[320px] sm:w-[350px] overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 backdrop-blur-xl">
          {/* Month Header Navigation */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs mt-1">
            {/* Blank padding days for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7 w-7" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDay === dayNum;

              const isToday =
                new Date().getFullYear() === viewYear &&
                new Date().getMonth() === viewMonth &&
                new Date().getDate() === dayNum;

              return (
                <button
                  type="button"
                  key={dayNum}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg font-medium transition cursor-pointer text-xs ${
                    isSelected
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-xs"
                      : isToday
                      ? "border border-blue-500/50 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-slate-800"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Time
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {String(selectedHour).padStart(2, "0")}:
                {String(selectedMinute).padStart(2, "0")} {selectedPeriod}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Hour Dropdown */}
              <select
                value={selectedHour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 py-1.5 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const hr = i + 1;
                  return (
                    <option key={hr} value={hr}>
                      {String(hr).padStart(2, "0")} hr
                    </option>
                  );
                })}
              </select>

              <span className="font-bold text-slate-400">:</span>

              {/* Minute Dropdown (5-min intervals + all options) */}
              <select
                value={selectedMinute}
                onChange={(e) => handleMinuteChange(Number(e.target.value))}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 py-1.5 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => (
                  <option key={min} value={min}>
                    {String(min).padStart(2, "0")} min
                  </option>
                ))}
              </select>

              {/* AM / PM Switcher */}
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handlePeriodChange("AM")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    selectedPeriod === "AM"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodChange("PM")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    selectedPeriod === "PM"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Footer Shortcuts & Done Button */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 dark:hover:bg-blue-700 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
