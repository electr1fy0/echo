import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ImageCarouselProps = {
  urls: string[];
  className?: string;
};

export function ImageCarousel({ urls, className }: ImageCarouselProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const isOpen = lightboxIdx !== null;
  const opening = useRef(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const deltaRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragPx, setDragPx] = useState(0);

  const close = useCallback(() => {
    setLightboxIdx(null);
    setDragging(false);
    setDragPx(0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i! > 0 ? i! - 1 : i));
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i! < urls.length - 1 ? i! + 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, urls.length, close]);

  const open = (i: number) => {
    if (opening.current) return;
    opening.current = true;
    setLightboxIdx(i);
    requestAnimationFrame(() => { opening.current = false; });
  };

  const slide = useCallback((dir: -1 | 1) => {
    setLightboxIdx((i) => {
      if (i === null) return i;
      const next = i + dir;
      if (next < 0 || next >= urls.length) return i;
      return next;
    });
    setDragPx(0);
    setDragging(false);
  }, [urls.length]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    deltaRef.current = 0;
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) < Math.abs(dy)) return;
    e.preventDefault();
    deltaRef.current = dx;
    setDragPx(dx);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (deltaRef.current < -50) slide(1);
    else if (deltaRef.current > 50) slide(-1);
    else {
      setDragPx(0);
      setDragging(false);
    }
    touchRef.current = null;
    deltaRef.current = 0;
  }, [slide]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className={cn("flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-lg bg-neutral-100 dark:bg-neutral-800", className)}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); open(i); }}
            className="snap-start shrink-0 w-full relative group cursor-pointer text-left"
          >
            <img src={url} alt="" className="w-full object-contain max-h-96 bg-neutral-100 dark:bg-neutral-800" loading="lazy" />
            {urls.length > 1 && (
              <div className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded pointer-events-none">
                {i + 1}/{urls.length}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Always-mounted lightbox — toggled via pointer-events + opacity */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black select-none",
          isOpen ? "touch-none" : "pointer-events-none",
        )}
        style={{
          opacity: isOpen ? 1 : 0,
          transition: isOpen ? "opacity 150ms ease-in" : "none",
        }}
        onTouchStart={isOpen ? onTouchStart : undefined}
        onTouchMove={isOpen ? onTouchMove : undefined}
        onTouchEnd={isOpen ? onTouchEnd : undefined}
      >
        {/* Close */}
        <button
          type="button"
          onMouseDown={(e) => { e.stopPropagation(); close(); }}
          className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Prev */}
        {lightboxIdx !== null && lightboxIdx > 0 && (
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); slide(-1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next */}
        {lightboxIdx !== null && lightboxIdx < urls.length - 1 && (
          <button
            type="button"
            onMouseDown={(e) => { e.stopPropagation(); slide(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Image track — close on click to the side of the image */}
        <div
          className="absolute inset-0 flex items-center overflow-hidden"
          onMouseDown={(e) => { e.stopPropagation(); close(); }}
        >
          <div
            className="flex items-center h-full pointer-events-none"
            style={{
              transform: `translate3d(calc(-${(lightboxIdx ?? 0) * 100}vw + ${dragPx}px), 0, 0)`,
              transition: dragging ? "none" : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
              willChange: "transform",
            }}
          >
            {urls.map((url, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center justify-center h-full"
                style={{ width: "100vw" }}
              >
                <img
                  src={url}
                  alt=""
                  className="max-w-[95vw] max-h-[95vh] object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Counter */}
        {lightboxIdx !== null && urls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs bg-white/10 text-white px-3 py-1 rounded-full pointer-events-none z-20">
            {lightboxIdx + 1} / {urls.length}
          </div>
        )}
      </div>
    </>
  );
}
