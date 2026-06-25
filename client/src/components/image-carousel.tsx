import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils";

type ImageCarouselProps = {
  urls: string[];
  className?: string;
};

export function ImageCarousel({ urls, className }: ImageCarouselProps) {
  const [lightboxIdx, setLightboxIdx] = useState(-1);

  if (urls.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3",
          className,
        )}
      >
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="snap-start shrink-0 relative cursor-pointer text-left"
          >
            <img
              src={url}
              alt=""
              draggable={false}
              className="max-h-80 min-h-48 max-w-full object-contain rounded-lg"
              loading="lazy"
            />
            {urls.length > 1 && (
              <div className="absolute bottom-1.5 right-1.5 text-[10px] font-medium backdrop-blur-sm bg-black/20 text-white/80 px-1.5 py-0.5 rounded-full pointer-events-none">
                {i + 1}/{urls.length}
              </div>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        open={lightboxIdx >= 0}
        index={lightboxIdx}
        close={() => setLightboxIdx(-1)}
        slides={urls.map((src) => ({ src }))}
      />
    </>
  );
}
