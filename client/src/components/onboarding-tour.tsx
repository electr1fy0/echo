import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { useIsMobile } from "@/hooks/use-mobile";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

function useMobilePlacement(
  desktopPlacement: "top" | "bottom" | "left" | "right",
  isMobile: boolean,
): "top" | "bottom" | "left" | "right" {
  if (!isMobile) return desktopPlacement;
  if (desktopPlacement === "right" || desktopPlacement === "left") return "top";
  return desktopPlacement;
}

function useElementPosition(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!selector) {
      setReady(true);
      return;
    }

    const el = document.querySelector(selector);
    if (el) {
      setRect(el.getBoundingClientRect());
      setReady(true);
    } else {
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          setRect(found.getBoundingClientRect());
          setReady(true);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }

    const handleResizeScroll = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };

    window.addEventListener("scroll", handleResizeScroll, true);
    window.addEventListener("resize", handleResizeScroll);
    return () => {
      window.removeEventListener("scroll", handleResizeScroll, true);
      window.removeEventListener("resize", handleResizeScroll);
    };
  }, [selector]);

  return { rect, ready };
}

function getTooltipPosition(
  placement: "top" | "bottom" | "left" | "right",
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  gap = 12
): { top: number; left: number } {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = targetRect.top - tooltipHeight - gap;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = targetRect.bottom + gap;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - gap;
      break;
    case "right":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + gap;
      break;
  }

  top = Math.max(12, Math.min(top, viewH - tooltipHeight - 12));
  left = Math.max(12, Math.min(left, viewW - tooltipWidth - 12));

  return { top, left };
}

function TourTooltip({
  targetRect,
  placement,
}: {
  targetRect: DOMRect;
  placement: "top" | "bottom" | "left" | "right";
}) {
  const { step, currentStep, totalSteps, next, prev, skip } = useOnboardingTour();
  const isMobile = useIsMobile();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) {
      setPos(getTooltipPosition(placement, targetRect, w, h));
    }
  }, [targetRect, placement]);

  if (!step) return null;

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 10001 }}
      className={`${isMobile ? "w-[calc(100vw-2rem)] max-w-72" : "w-72"} bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {[...Array(totalSteps)].map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "bg-[var(--brand)] w-5 h-1.5"
                  : i < currentStep
                    ? "bg-neutral-300 dark:bg-neutral-600 w-1.5 h-1.5"
                    : "bg-neutral-200 dark:bg-neutral-700 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
        <button
          onClick={skip}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer p-0.5"
          aria-label="Skip tour"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>

      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        {step.title}
      </h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
        {step.description}
      </p>

      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={currentStep === 0}
          className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back
        </button>
        <button
          onClick={next}
          className="flex items-center gap-1 text-xs font-medium bg-[var(--brand)] text-white px-3.5 py-1.5 rounded-lg hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
        >
          {currentStep < totalSteps - 1 ? (
            <>
              Next
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </>
          ) : (
            "Got it!"
          )}
        </button>
      </div>
    </motion.div>
  );
}

function CenterCard() {
  const { step, currentStep, totalSteps, next, skip } = useOnboardingTour();
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
      }}
      className={`${isMobile ? "w-[calc(100vw-2rem)] max-w-80" : "w-80"} bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl p-6 text-center`}
    >
      <div className="flex justify-center mb-3">
        <div className="flex items-center gap-1.5">
          {[...Array(totalSteps)].map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "bg-[var(--brand)] w-5 h-1.5"
                  : i < currentStep
                    ? "bg-neutral-300 dark:bg-neutral-600 w-1.5 h-1.5"
                    : "bg-neutral-200 dark:bg-neutral-700 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="size-12 rounded-xl bg-[var(--brand-10)] flex items-center justify-center mx-auto mb-3">
        <img src="/turnsoutlogo.svg" alt="" className="size-7 invert dark:invert-0 opacity-60" />
      </div>

      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
        {step.title}
      </h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-5">
        {step.description}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={skip}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
        >
          Skip tour
        </button>
        <button
          onClick={next}
          className="flex items-center gap-1 text-xs font-medium bg-[var(--brand)] text-white px-4 py-1.5 rounded-lg hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
        >
          {currentStep < totalSteps - 1 ? (
            <>
              Get Started
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </>
          ) : (
            "Got it!"
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function OnboardingTour() {
  const { isActive, step, skip } = useOnboardingTour();
  const isMobile = useIsMobile();
  const { rect, ready } = useElementPosition(isActive ? step.targetSelector : null);
  const [targetHighlight, setTargetHighlight] = useState<DOMRect | null>(null);

  const placement = useMobilePlacement(step.placement, isMobile);

  useEffect(() => {
    if (step.targetSelector && rect) {
      setTargetHighlight(rect);
    } else {
      setTargetHighlight(null);
    }
  }, [step.targetSelector, rect]);

  useEffect(() => {
    if (!step.targetSelector) return;
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (el) {
      el.style.outline = `2px solid var(--brand)`;
      el.style.outlineOffset = "3px";
      el.style.borderRadius = "8px";
      el.style.transition = "outline-color 0.2s";
      return () => {
        el.style.outline = "";
        el.style.outlineOffset = "";
        el.style.borderRadius = "";
      };
    }
  }, [step.targetSelector]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        skip();
      }
    }
    if (isActive) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [isActive, skip]);

  if (!isActive || !ready) return null;

  const isCenterStep = !step.targetSelector;

  return createPortal(
    <div data-onboarding-portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
        onClick={() => {}}
      />

      {isCenterStep ? (
        <CenterCard />
      ) : targetHighlight ? (
        <TourTooltip targetRect={targetHighlight} placement={placement} />
      ) : null}
    </div>,
    document.body
  );
}
