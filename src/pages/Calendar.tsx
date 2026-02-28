import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays, Package, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarItems, CalendarDeliverable, CalendarTask } from "@/hooks/use-calendar";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MAX_VISIBLE = 3;

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface DayItems {
  deliverables: CalendarDeliverable[];
  tasks: CalendarTask[];
}

interface CalendarDayProps {
  day: number | null;
  dateStr: string | null;
  isToday: boolean;
  isCurrentMonth: boolean;
  items: DayItems;
  onDeliverableClick: () => void;
  onTaskClick: () => void;
}

function CalendarDay({
  day,
  isToday,
  isCurrentMonth,
  items,
  onDeliverableClick,
  onTaskClick,
}: CalendarDayProps) {
  if (day === null) {
    return <div className="min-h-[100px] rounded-lg border border-border/30 bg-muted/20" />;
  }

  const totalItems = items.deliverables.length + items.tasks.length;
  const visibleDeliverables = items.deliverables.slice(0, MAX_VISIBLE);
  const visibleTasks = items.tasks.slice(0, Math.max(0, MAX_VISIBLE - visibleDeliverables.length));
  const overflowCount = items.deliverables.length + items.tasks.length
    - visibleDeliverables.length - visibleTasks.length;

  return (
    <div
      className={cn(
        "min-h-[100px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors",
        isToday
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/50 bg-card hover:bg-muted/30",
        !isCurrentMonth && "opacity-40",
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
            isToday
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70",
          )}
        >
          {day}
        </span>
        {totalItems > 0 && (
          <span className="text-[10px] text-muted-foreground leading-none">{totalItems}</span>
        )}
      </div>

      {/* Deliverable chips */}
      {visibleDeliverables.map((d) => (
        <button
          key={d.id}
          onClick={onDeliverableClick}
          className="w-full text-left truncate text-[10px] leading-snug px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition-colors border border-indigo-500/20"
          title={d.name}
        >
          {d.name}
        </button>
      ))}

      {/* Task chips */}
      {visibleTasks.map((t) => (
        <button
          key={t.id}
          onClick={onTaskClick}
          className="w-full text-left truncate text-[10px] leading-snug px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors border border-emerald-500/20"
          title={t.name}
        >
          {t.name}
        </button>
      ))}

      {/* Overflow indicator */}
      {overflowCount > 0 && (
        <span className="text-[10px] text-muted-foreground px-1">
          +{overflowCount} more
        </span>
      )}
    </div>
  );
}

function TodayItem({ item, type, onClick }: {
  item: CalendarDeliverable | CalendarTask;
  type: "deliverable" | "task";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-lg border transition-colors hover:bg-muted/50",
        type === "deliverable"
          ? "border-indigo-500/20 bg-indigo-500/5"
          : "border-emerald-500/20 bg-emerald-500/5",
      )}
    >
      {type === "deliverable" ? (
        <Package className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-500" />
      ) : (
        <ListTodo className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{item.name}</p>
        {item.clientName && (
          <p className="text-[10px] text-muted-foreground truncate">{item.clientName}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className="text-[10px] shrink-0 leading-none py-0.5 px-1.5"
      >
        {item.status}
      </Badge>
    </button>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const { data, isLoading } = useCalendarItems(year, month);

  const todayStr = toDateString(new Date());

  // Build items-by-date map
  const itemsByDate = useMemo(() => {
    const map: Record<string, DayItems> = {};
    (data?.deliverables ?? []).forEach((d) => {
      if (!map[d.dueDate]) map[d.dueDate] = { deliverables: [], tasks: [] };
      map[d.dueDate].deliverables.push(d);
    });
    (data?.tasks ?? []).forEach((t) => {
      if (!map[t.dueDate]) map[t.dueDate] = { deliverables: [], tasks: [] };
      map[t.dueDate].tasks.push(t);
    });
    return map;
  }, [data]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month fill-in days
  const prevMonthDays = startDayOfWeek;
  // Next month fill-in days
  const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;
  const nextMonthDays = totalCells - prevMonthDays - daysInMonth;

  type GridCell = { day: number; dateStr: string; isCurrentMonth: boolean } | null;

  const gridCells: GridCell[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    gridCells.push({ day, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    gridCells.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Next month padding
  for (let d = 1; d <= nextMonthDays; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    gridCells.push({ day: d, dateStr, isCurrentMonth: false });
  }

  // Today's items
  const todayItems = itemsByDate[todayStr] ?? { deliverables: [], tasks: [] };

  function goToPrevMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function goToNextMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-border/40 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Calendar</h1>
              <p className="text-sm text-muted-foreground">Due dates across deliverables and tasks</p>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center font-semibold text-sm">
              {MONTH_NAMES[month - 1]} {year}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 ml-1" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/40 border border-indigo-500/30" />
            Deliverables
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/30" />
            Tasks
          </div>
        </div>
      </div>

      {/* Main content: calendar + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="min-h-[100px] rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {gridCells.map((cell, i) => {
                if (!cell) {
                  return <div key={i} className="min-h-[100px] rounded-lg border border-border/30 bg-muted/20" />;
                }
                const cellItems = itemsByDate[cell.dateStr] ?? { deliverables: [], tasks: [] };
                return (
                  <CalendarDay
                    key={i}
                    day={cell.day}
                    dateStr={cell.dateStr}
                    isToday={cell.dateStr === todayStr}
                    isCurrentMonth={cell.isCurrentMonth}
                    items={cellItems}
                    onDeliverableClick={() => navigate("/deliverables")}
                    onTaskClick={() => navigate("/tasks")}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar — Due Today */}
        <div className="w-64 shrink-0 border-l border-border/40 bg-muted/10 flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-border/40 shrink-0">
            <h2 className="text-sm font-semibold">Due Today</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </>
            ) : todayItems.deliverables.length === 0 && todayItems.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nothing due today</p>
              </div>
            ) : (
              <>
                {todayItems.deliverables.map((d) => (
                  <TodayItem
                    key={d.id}
                    item={d}
                    type="deliverable"
                    onClick={() => navigate("/deliverables")}
                  />
                ))}
                {todayItems.tasks.map((t) => (
                  <TodayItem
                    key={t.id}
                    item={t}
                    type="task"
                    onClick={() => navigate("/tasks")}
                  />
                ))}
              </>
            )}
          </div>

          {/* Summary counts */}
          {!isLoading && (todayItems.deliverables.length > 0 || todayItems.tasks.length > 0) && (
            <div className="px-4 py-3 border-t border-border/40 shrink-0">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{todayItems.deliverables.length} deliverable{todayItems.deliverables.length !== 1 ? "s" : ""}</span>
                <span>{todayItems.tasks.length} task{todayItems.tasks.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
