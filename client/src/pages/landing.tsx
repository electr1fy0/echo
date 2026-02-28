import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";

const pageClassName =
  "relative min-h-screen min-h-[100svh] overflow-hidden bg-white text-slate-900";
const heroCardClassName =
  "relative h-[100svh] min-h-[100svh] w-full overflow-hidden rounded-none border-0 shadow-none md:mx-auto md:h-auto md:min-h-0 md:max-w-6xl md:aspect-video md:rounded-[2rem] md:border md:border-white/60 md:shadow-[0_16px_40px_-30px_rgba(30,58,138,0.24)]";
const headingStyle = { fontFamily: '"Lora", serif' } as const;

export default function Landing() {
  return (
    <PageTransition className={pageClassName}>
      <main className="relative h-[100svh] min-h-[100svh] px-0 md:h-dvh md:min-h-0 md:px-8">
        <section className="mx-auto flex h-full w-full max-w-6xl items-center py-0 md:py-0">
          <div className={heroCardClassName}>
            <img
              src="/landing_background.png"
              alt="Floral sky background"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-white/30 to-white/45" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.42] mix-blend-normal"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 22%, rgba(0,0,0,0.26) 0.8px, transparent 1px), radial-gradient(circle at 76% 68%, rgba(0,0,0,0.2) 0.75px, transparent 1px), radial-gradient(circle at 40% 78%, rgba(255,255,255,0.25) 0.6px, transparent 0.95px)",
                backgroundSize: "4px 4px, 5px 5px, 6px 6px",
              }}
            />

            <div className="relative flex h-full flex-col items-center justify-center px-5 text-center md:px-20">
              <Link to="/auth" className="mb-4 inline-block md:mb-6">
                <img src="/echo.svg" alt="Echo" className="size-7 md:size-10" />
              </Link>
              <h1
                className="max-w-4xl text-3xl leading-[1.08] text-slate-900 sm:text-4xl md:text-6xl lg:text-7xl"
                style={headingStyle}
              >
                An open QnA platform
                <br />
                for the rest of us.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:mt-5 md:mt-6 md:text-lg">
                Questions stay clear, answers stay readable,
                <br />
                and each Chamber keeps its own context.
              </p>
              <div className="mt-7 sm:mt-8 md:mt-9">
                <Link to="/auth">
                  <Button className="h-11 w-full rounded-full bg-[#ff5a1f] px-8 text-sm text-white hover:bg-[#e94a12] sm:w-auto">
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
