// components/layout/TelegramBackground.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** نمایش overlay تیره در حالت دارک (پیش‌فرض: true) */
  darkOverlay?: boolean;
  /** شفافیت کل لایه (۰ تا ۱) */
  opacity?: number;
  /** z-index لایه (پیش‌فرض: 0) */
  zIndex?: number;
};

export default function TelegramBackground({
  darkOverlay = true,
  opacity = 1,
  zIndex = 0,
}: Props) {
  const wallpaperRef = useRef<HTMLDivElement>(null);
  const twallpaperRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    if (!wallpaperRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("twallpaper");
        if (cancelled || !wallpaperRef.current) return;

        const TwallpaperCtor: any =
          (mod as any).Twallpaper ?? (mod as any).default;

        if (typeof TwallpaperCtor !== "function") {
          throw new Error("Twallpaper constructor not found");
        }

        twallpaperRef.current = new TwallpaperCtor(wallpaperRef.current, {
          fps: 60,
          tails: 90,
          animate: true,
          scrollAnimate: true,
          colors: ["#dbddbb", "#6ba587", "#d5d88d", "#88b884"],
          pattern: {
            image: "/patterns/telegram.svg",
            background: "#000",
            blur: 0,
            size: "420px",
            opacity: 0.5,
            mask: false,
          },
        });
      } catch (err) {
        console.warn("Twallpaper init failed, using CSS fallback:", err);
      }
    })();

    return () => {
      cancelled = true;
      try {
        twallpaperRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      twallpaperRef.current = null;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex, opacity }}
    >
      {/* لایه ۱: گرادیان پایه — همیشه دیده می‌شود */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(-45deg, #dbddbb, #6ba587, #d5d88d, #88b884, #6ba587, #dbddbb)",
          backgroundSize: "400% 400%",
          animation: "telegram-gradient 18s ease infinite",
        }}
      />

      {/* لایه ۲: Twallpaper (روی گرادیان) */}
      <div ref={wallpaperRef} className="absolute inset-0" />

      {/* لایه ۳: overlay تیره در دارک */}
      {darkOverlay && (
        <div className="absolute inset-0 hidden bg-black/40 dark:block" />
      )}
    </div>
  );
}