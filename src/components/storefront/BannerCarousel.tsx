import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { useStorefront } from "./StoreContext";

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  button_label: string | null;
  button_link: string | null;
  desktop_url: string | null;
  mobile_url: string | null;
};

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const { store } = useStorefront();

  useEffect(() => {
    if (!emblaApi) return;
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <section className="relative mt-3 px-4 md:mt-4 md:px-6">
      <div className="overflow-hidden rounded-xl md:rounded-[14px]" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => {
            const link = b.button_link || `/loja/${store.slug}`;
            return (
              <div key={b.id} className="relative min-w-0 flex-[0_0_100%] overflow-hidden rounded-xl md:rounded-[14px]">
                <picture>
                  {b.mobile_url && <source media="(max-width: 768px)" srcSet={b.mobile_url} />}
                  <img
                    src={b.desktop_url ?? b.mobile_url ?? ""}
                    alt={b.title ?? ""}
                    className="block h-[60vh] max-h-[600px] min-h-[280px] w-full rounded-xl object-cover md:h-[480px] md:rounded-[14px]"
                    loading="eager"
                  />
                </picture>
                {(b.title || b.subtitle || b.button_label) && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 pb-10 text-background md:pb-16">
                      {b.title && (
                        <h2 className="font-display text-3xl font-bold drop-shadow md:text-5xl">{b.title}</h2>
                      )}
                      {b.subtitle && <p className="max-w-xl text-sm md:text-base">{b.subtitle}</p>}
                      {b.button_label && (
                        <a
                          href={link}
                          className="mt-2 inline-flex w-fit items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow transition hover:opacity-90"
                        >
                          {b.button_label}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Banner ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className="h-2 w-2 rounded-full bg-background/70 transition hover:bg-background"
            />
          ))}
        </div>
      )}
    </section>
  );
}
