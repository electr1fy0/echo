import { PageTransition } from "@/components/page-transition";
import { ShimmeringText } from "@/components/shimmering-text";
import { TextFlip } from "@/components/text-flip";
import {
  SlideToUnlock,
  SlideToUnlockHandle,
  SlideToUnlockText,
  SlideToUnlockTrack,
} from "@/components/slide-to-unlock";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useSound } from "@/hooks/use-sound";

const pageClassName = "relative h-dvh overflow-hidden bg-white text-slate-900";
const heroCardClassName =
  "relative h-full w-full overflow-hidden rounded-none border-0 shadow-none md:mx-auto md:h-auto md:max-w-6xl md:aspect-video md:rounded-[2rem] md:border md:border-white/60 md:shadow-[0_16px_40px_-30px_rgba(30,58,138,0.24)]";
const headingStyle = { fontFamily: '"Lora", serif' } as const;

export default function Landing() {
  const { open } = useAuthModal();
  const [play] = useSound("https://assets.chanhdai.com/sounds/ios/unlock.mp3", {
    volume: 0.5,
  });

  return (
    <PageTransition className={pageClassName}>
      <main className="relative h-dvh px-0 md:px-8">
        <section className="mx-auto flex h-full w-full max-w-6xl items-center py-0 md:py-0">
          <div className={heroCardClassName}>
            <img
              src="/landing_background.png"
              alt="Floral sky background"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-white/30 to-white/45" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/90 via-white/60 to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent md:hidden" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.42] mix-blend-normal"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 22%, rgba(0,0,0,0.26) 0.8px, transparent 1px), radial-gradient(circle at 76% 68%, rgba(0,0,0,0.2) 0.75px, transparent 1px), radial-gradient(circle at 40% 78%, rgba(255,255,255,0.25) 0.6px, transparent 0.95px)",
                backgroundSize: "4px 4px, 5px 5px, 6px 6px",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)",
              }}
            />

            <div className="relative flex h-full flex-col items-center justify-center px-5 text-center md:px-20">
              <img
                src="/turnsout.svg"
                alt="TurnsOut"
                className="mb-4 size-9 md:mb-6 md:size-10"
              />
              <h1
                className="max-w-4xl text-3xl leading-[1.08] text-slate-900 sm:text-4xl md:text-6xl lg:text-7xl"
                style={headingStyle}
              >
                An open community
                <br />
                for the rest of us.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:mt-5 md:mt-6 md:text-lg">
                <TextFlip
                  as="span"
                  interval={3}
                  className="font-medium text-slate-900"
                >
                  <span>Ask. Trade. Ride. Connect.</span>
                  <span>The platform built for campus life.</span>
                  <span>Where students help students.</span>
                  <span>Campus questions, answered by the people who get it.</span>
                  <span>Your campus community, one message away.</span>
                </TextFlip>
              </p>
              <div className="mt-7 sm:mt-8 md:mt-9">
                <SlideToUnlock
                  onUnlock={() => {
                    play();
                    open("signin");
                  }}
                >
                  <SlideToUnlockTrack>
                    <SlideToUnlockText>
                      {({ isDragging }) => (
                        <ShimmeringText
                          text="slide to unlock"
                          isStopped={isDragging}
                          className="[--color:rgba(120,113,108,0.6)] [--shimmering-color:rgb(120,113,108)]"
                        />
                      )}
                    </SlideToUnlockText>
                    <SlideToUnlockHandle className="bg-[#ff5a1f] text-white" />
                  </SlideToUnlockTrack>
                </SlideToUnlock>
                <p className="mt-4 text-xs text-slate-500">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => open("signin")}
                    className="underline cursor-pointer"
                  >
                    sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
