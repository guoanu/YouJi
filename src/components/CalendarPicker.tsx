import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface CalendarPickerProps {
  scheduleDates: Set<string>;
  onSelectDate: (date: string) => void;
  onDeleteDate: (date: string) => void;
  onClose: () => void;
}

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number): number {
  // 0=Sun ... 6=Sat → map to 0=Mon ... 6=Sun
  const jsDay = new Date(year, month, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function formatYmd(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function todayYmd(): string {
  const now = new Date();
  return formatYmd(now.getFullYear(), now.getMonth(), now.getDate());
}

export function CalendarPicker({ scheduleDates, onSelectDate, onDeleteDate, onClose }: CalendarPickerProps) {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; date: string } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, date: string) => {
    if (!scheduleDates.has(date)) return;
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, date });
  }, [scheduleDates]);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => closeCtxMenu();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [ctxMenu, closeCtxMenu]);

  const today = todayYmd();
  const monthNames = useMemo(() => {
    const base = [
      t("calendar.months.1", { defaultValue: "1月" }),
      t("calendar.months.2", { defaultValue: "2月" }),
      t("calendar.months.3", { defaultValue: "3月" }),
      t("calendar.months.4", { defaultValue: "4月" }),
      t("calendar.months.5", { defaultValue: "5月" }),
      t("calendar.months.6", { defaultValue: "6月" }),
      t("calendar.months.7", { defaultValue: "7月" }),
      t("calendar.months.8", { defaultValue: "8月" }),
      t("calendar.months.9", { defaultValue: "9月" }),
      t("calendar.months.10", { defaultValue: "10月" }),
      t("calendar.months.11", { defaultValue: "11月" }),
      t("calendar.months.12", { defaultValue: "12月" }),
    ];
    return base;
  }, [t]);

  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekdayOfMonth(year, month);

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const yearRange = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => current - 10 + i);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const cells: Array<{ day: number | null; ymd: string }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, ymd: "" });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, ymd: formatYmd(year, month, d) });
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/15"
      onClick={onClose}
    >
      <div
        className="bg-cloud border border-paper-deep/50 rounded-xl shadow-lg p-4 w-[300px] animate-menu-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Year/month header */}
        <div className="flex items-center justify-between mb-3 select-none">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-ghost hover:text-ink hover:bg-paper-warm transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-[14px] font-display font-medium text-ink hover:text-bamboo transition-colors cursor-pointer"
            >
              {year}年
            </button>
            <button
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="text-[14px] font-display font-medium text-ink hover:text-bamboo transition-colors cursor-pointer"
            >
              {monthNames[month]}
            </button>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-ghost hover:text-ink hover:bg-paper-warm transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Year picker */}
        {showYearPicker && (
          <div className="mb-3 p-2 border border-paper-deep/30 rounded-lg max-h-[140px] overflow-y-auto">
            <div className="grid grid-cols-5 gap-1">
              {yearRange.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setShowYearPicker(false); }}
                  className={`text-[11px] py-1 rounded-md transition-colors cursor-pointer ${
                    y === year ? "bg-bamboo/15 text-bamboo font-medium" : "text-ink-faint hover:bg-paper-warm"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[10px] text-ink-ghost/50 font-mono py-1">
              {label}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const isToday = cell.ymd === today;
            const hasSchedule = scheduleDates.has(cell.ymd);

            return (
              <button
                key={cell.ymd}
                onClick={() => onSelectDate(cell.ymd)}
                onContextMenu={(e) => handleContextMenu(e, cell.ymd)}
                className={`relative aspect-square flex items-center justify-center rounded-lg text-[12px] font-body transition-colors cursor-pointer select-none ${
                  isToday
                    ? "text-blue-500 font-medium"
                    : "text-ink-faint hover:bg-paper-warm"
                }`}
              >
                {isToday && (
                  <span className="absolute inset-0.5 rounded-full border border-blue-400/60" />
                )}
                {cell.day}
                {hasSchedule && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400/80" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          className="fixed z-[9999] min-w-[120px] py-1 bg-cloud/95 backdrop-blur-sm border border-paper-deep/50 rounded-lg shadow-lg animate-menu-enter"
          style={{ left: ctxMenu.x + 4, top: ctxMenu.y + 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => { onDeleteDate(ctxMenu.date); closeCtxMenu(); }}
            className="w-full text-left px-3 py-1.5 text-[12px] text-red-400 hover:bg-danger-bg/50 transition-colors cursor-pointer"
          >
            {t("calendar.deleteDate", { defaultValue: "删除该日程" })}
          </button>
        </div>
      )}
    </div>
  );
}
