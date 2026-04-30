import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../client/components/ui/button";

export function Hero() {
  return (
    <div className="relative w-full pt-14">
      <TopGradient />
      <BottomGradient />
      <div className="md:p-24">
        <div className="max-w-8xl mx-auto px-6 lg:px-8">
          <div className="lg:mb-18 mx-auto max-w-3xl text-center">
            <h1 className="text-foreground text-5xl font-bold sm:text-6xl">
              Stay connected to your{" "}
              <span className="italic">loved ones</span> with{" "}
              <span className="text-gradient-primary">AI-powered daily calls</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8">
              Golden Voices Connect calls your elderly family members every day so you can rest easy knowing they are okay. Get real-time mood and health summaries after each call.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" variant="outline" asChild>
                <WaspRouterLink to={routes.PricingPageRoute.to}>
                  Learn More
                </WaspRouterLink>
              </Button>
              <Button size="lg" variant="default" asChild>
                <WaspRouterLink to={routes.SignupRoute.to}>
                  Get Started <span aria-hidden="true">→</span>
                </WaspRouterLink>
              </Button>
            </div>
          </div>
          <div className="mt-14 flow-root sm:mt-14">
            <div className="m-2 flex justify-center rounded-xl bg-gradient-to-br from-amber-100 via-orange-50 to-purple-100 md:flex lg:-m-4 lg:rounded-2xl lg:p-4">
              <div className="flex w-full max-w-3xl flex-col items-center justify-center px-8 py-16 text-center">
                <div className="mb-4 flex gap-4 text-6xl">
                  <span>📞</span>
                  <span>👵</span>
                  <span>💚</span>
                </div>
                <p className="text-lg font-medium text-foreground/80">
                  Your loved ones deserve to feel connected.
                </p>
                <p className="mt-2 text-sm text-foreground/60">
                  Daily AI calls. Real conversations. Peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className="absolute right-0 top-0 -z-10 w-full transform-gpu overflow-hidden blur-3xl sm:top-0"
      aria-hidden="true"
    >
      <div
        className="aspect-1020/880 w-280 bg-linear-to-tr flex-none from-amber-400 to-purple-300 opacity-10 sm:right-1/4 sm:translate-x-1/2 dark:hidden"
        style={{
          clipPath:
            "polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)",
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className="absolute inset-x-0 top-[calc(100%-40rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-65rem)]"
      aria-hidden="true"
    >
      <div
        className="aspect-1020/880 w-360 bg-linear-to-br relative from-amber-400 to-purple-300 opacity-10 sm:-left-3/4 sm:translate-x-1/4 dark:hidden"
        style={{
          clipPath: "ellipse(80% 30% at 80% 50%)",
        }}
      />
    </div>
  );
}
