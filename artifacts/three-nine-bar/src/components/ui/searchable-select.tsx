import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  disabled = false,
  className,
  emptyMessage = "Tidak ditemukan.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ?? "").toLowerCase().includes(q)
    );
  }, [options, search]);

  // Close on outside click / touch
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen(prev => !prev);
    if (open) setSearch("");
  };

  const handleSelect = (optValue: string) => {
    onValueChange(optValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
          "transition-colors hover:bg-accent/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
      >
        <span className={cn("truncate text-left flex-1 min-w-0", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? (
            <span className="flex flex-col leading-tight">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs text-muted-foreground">{selectedOption.sublabel}</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={-1}
              className="p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute z-[200] w-full mt-1 rounded-md border border-border bg-popover shadow-xl",
            "overflow-hidden",
            // Ensure it never goes off-screen on mobile by clamping width
            "min-w-[200px]",
          )}
          style={{ maxWidth: "calc(100vw - 32px)" }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border/60 bg-background/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className={cn(
                  "w-full pl-8 pr-3 py-1.5 text-sm rounded-sm",
                  "bg-background border border-border/60",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                  "placeholder:text-muted-foreground/60",
                  "text-foreground",
                )}
              />
            </div>
            {search && (
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                {filtered.length} hasil ditemukan
              </p>
            )}
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "280px" }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={e => e.preventDefault()} // prevent blur before click
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-start gap-2 px-3 py-2.5 text-sm text-left transition-colors",
                      "hover:bg-primary/10 active:bg-primary/20",
                      isSelected && "bg-primary/15 text-primary",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0 transition-opacity",
                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block text-xs text-muted-foreground truncate">{opt.sublabel}</span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
