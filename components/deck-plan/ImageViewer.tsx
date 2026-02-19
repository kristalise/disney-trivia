'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface ImageViewerHandle {
  reset: () => void;
}

interface ImageViewerProps {
  src: string;
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SCROLL_STEP = 0.25;
const DOUBLE_CLICK_SCALE = 2.5;

const ImageViewer = forwardRef<ImageViewerHandle, ImageViewerProps>(
  function ImageViewer({ src, alt }, ref) {
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [enableTransition, setEnableTransition] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const dragStart = useRef({ x: 0, y: 0 });
    const translateStart = useRef({ x: 0, y: 0 });
    const lastPinchDist = useRef<number | null>(null);
    const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
    const lastTapTime = useRef(0);

    const clampTranslate = useCallback(
      (tx: number, ty: number, s: number) => {
        const container = containerRef.current;
        const img = imgRef.current;
        if (!container || !img) return { x: tx, y: ty };

        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // Calculate displayed image dimensions at scale 1
        // The image is rendered with w-full h-auto, so it fills container width
        const displayW = cw;
        const displayH = (ih / iw) * cw;

        const scaledW = displayW * s;
        const scaledH = displayH * s;

        let cx = tx;
        let cy = ty;

        if (scaledW <= cw) {
          cx = 0;
        } else {
          const minX = cw - scaledW;
          cx = Math.min(0, Math.max(minX, cx));
        }

        if (scaledH <= ch) {
          cy = 0;
        } else {
          const minY = ch - scaledH;
          cy = Math.min(0, Math.max(minY, cy));
        }

        return { x: cx, y: cy };
      },
      []
    );

    const applyZoom = useCallback(
      (
        newScale: number,
        centerX: number,
        centerY: number,
        smooth: boolean
      ) => {
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        setEnableTransition(smooth);

        setScale((prevScale) => {
          setTranslate((prev) => {
            // Zoom toward the center point
            const factor = clamped / prevScale;
            const nx = centerX - (centerX - prev.x) * factor;
            const ny = centerY - (centerY - prev.y) * factor;
            return clampTranslate(nx, ny, clamped);
          });
          return clamped;
        });
      },
      [clampTranslate]
    );

    const resetView = useCallback(() => {
      setEnableTransition(true);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }, []);

    useImperativeHandle(ref, () => ({ reset: resetView }), [resetView]);

    // Reset when image changes
    useEffect(() => {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      setEnableTransition(false);
    }, [src]);

    // Wheel zoom — raw listener for passive: false
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? -SCROLL_STEP : SCROLL_STEP;

        setScale((prev) => {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
          const factor = next / prev;
          setTranslate((t) =>
            clampTranslate(
              cx - (cx - t.x) * factor,
              cy - (cy - t.y) * factor,
              next
            )
          );
          return next;
        });
        setEnableTransition(false);
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }, [clampTranslate]);

    // Touch handlers — raw listeners for passive: false
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          // Check for double-tap
          const now = Date.now();
          if (now - lastTapTime.current < 300) {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const cx = e.touches[0].clientX - rect.left;
            const cy = e.touches[0].clientY - rect.top;
            setScale((prev) => {
              const next = prev === 1 ? DOUBLE_CLICK_SCALE : 1;
              if (next === 1) {
                setTranslate({ x: 0, y: 0 });
              } else {
                const factor = next / prev;
                setTranslate((t) =>
                  clampTranslate(
                    cx - (cx - t.x) * factor,
                    cy - (cy - t.y) * factor,
                    next
                  )
                );
              }
              return next;
            });
            setEnableTransition(true);
            lastTapTime.current = 0;
            return;
          }
          lastTapTime.current = now;

          // Start single-finger pan
          dragStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          translateStart.current = { ...translate };
          setIsDragging(true);
        } else if (e.touches.length === 2) {
          // Start pinch
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastPinchDist.current = Math.hypot(dx, dy);
          const rect = container.getBoundingClientRect();
          lastPinchCenter.current = {
            x:
              (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
            y:
              (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
          };
          setIsDragging(false);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1 && isDragging) {
          // Only prevent default (block page scroll) when zoomed in
          if (scale > 1) {
            e.preventDefault();
          }
          const dx = e.touches[0].clientX - dragStart.current.x;
          const dy = e.touches[0].clientY - dragStart.current.y;
          setTranslate(
            clampTranslate(
              translateStart.current.x + dx,
              translateStart.current.y + dy,
              scale
            )
          );
          setEnableTransition(false);
        } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const ratio = dist / lastPinchDist.current;

          const rect = container.getBoundingClientRect();
          const cx =
            (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const cy =
            (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

          setScale((prev) => {
            const next = Math.min(
              MAX_SCALE,
              Math.max(MIN_SCALE, prev * ratio)
            );
            const factor = next / prev;
            setTranslate((t) =>
              clampTranslate(
                cx - (cx - t.x) * factor,
                cy - (cy - t.y) * factor,
                next
              )
            );
            return next;
          });

          lastPinchDist.current = dist;
          lastPinchCenter.current = { x: cx, y: cy };
          setEnableTransition(false);
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
          lastPinchDist.current = null;
          lastPinchCenter.current = null;
        }
        if (e.touches.length === 0) {
          setIsDragging(false);
        }
      };

      container.addEventListener('touchstart', handleTouchStart, {
        passive: false,
      });
      container.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }, [scale, translate, isDragging, clampTranslate]);

    // Mouse drag handlers
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (scale <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        translateStart.current = { ...translate };
        setEnableTransition(false);
      },
      [scale, translate]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setTranslate(
          clampTranslate(
            translateStart.current.x + dx,
            translateStart.current.y + dy,
            scale
          )
        );
      },
      [isDragging, scale, clampTranslate]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Double-click zoom toggle
    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        if (scale === 1) {
          applyZoom(DOUBLE_CLICK_SCALE, cx, cy, true);
        } else {
          resetView();
        }
      },
      [scale, applyZoom, resetView]
    );

    const zoomIn = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const cx = container.clientWidth / 2;
      const cy = container.clientHeight / 2;
      applyZoom(scale + SCROLL_STEP * 2, cx, cy, true);
    }, [scale, applyZoom]);

    const zoomOut = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const cx = container.clientWidth / 2;
      const cy = container.clientHeight / 2;
      applyZoom(scale - SCROLL_STEP * 2, cx, cy, true);
    }, [scale, applyZoom]);

    const zoomPercent = Math.round(scale * 100);

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-2xl select-none"
        style={{
          touchAction: scale > 1 ? 'none' : 'pan-y',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-auto block"
          style={{
            transformOrigin: '0 0',
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: enableTransition
              ? 'transform 0.3s ease-out'
              : 'none',
          }}
        />

        {/* Zoom percentage indicator (bottom-left) */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-lg pointer-events-none">
          {zoomPercent}%
        </div>

        {/* Zoom control buttons (bottom-right) */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetView}
            disabled={scale === 1}
            className="h-8 px-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Reset zoom"
          >
            Reset
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

export default ImageViewer;
