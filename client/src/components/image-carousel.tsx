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
          "flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-lg bg-neutral-100 dark:bg-neutral-800",
          className,
        )}
      >
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="snap-start shrink-0 w-full relative cursor-pointer text-left"
          >
            <img
              src={url}
              alt=""
              draggable={false}
              className="w-full object-contain max-h-96 bg-neutral-100 dark:bg-neutral-800"
              loading="lazy"
            />
            {urls.length > 1 && (
              <div className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded pointer-events-none">
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
