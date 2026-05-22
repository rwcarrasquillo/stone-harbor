"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Stone Harbor — RotatingNatureBackdrop.
 *
 * A subtle multi-image backdrop layer. Cross-fades through a set of
 * nature images on a slow interval, with a drifting "mist plume"
 * traversing the panel for continuous atmospheric motion. Used
 * underneath text content as ambient depth, not as the dominant
 * visual.
 *
 * Why a reusable component:
 *   The pattern landed first on /start-here. Repeating the same
 *   AnimatePresence + interval + mist-plume markup inline at every
 *   call site would be brittle and noisy. Centralizing it here means
 *   future pages get the same brand-aligned motion in one prop call.
 *
 * Usage:
 *   <div className="relative ... your-card-styles ...">
 *     <RotatingNatureBackdrop
 *       images={["/calm-lake.png", "/mountain-dawn.png"]}
 *       opacity={0.12}
 *     />
 *     ... your card content (which sits above the backdrop) ...
 *   </div>
 *
 * The component is absolutely positioned (`inset-0`) and
 * `pointer-events-none`, so it never interferes with clicks on the
 * content above it. The parent MUST have `position: relative` and
 * `overflow: hidden` for the mist plume to be clipped to the card.
 *
 * Therapeutic note:
 *   Opacity defaults to 0.14. Anything higher than ~0.25 starts
 *   competing with text legibility, especially with the cream/gold
 *   palette Stone Harbor uses. Keep it subtle. The motion is the
 *   point, not the photographs themselves.
 */
type Props = {
  /** Image paths under /public. The component cycles through them in order. */
  images: string[];
  /** Opacity for the image layer. Default 0.14 (subtle ambient). */
  opacity?: number;
  /** Milliseconds each image stays visible before fading to the next. Default 15000. */
  rotationMs?: number;
  /** Whether to render the drifting mist plume on top of the images. Default true. */
  mist?: boolean;
  /** Whether to render the rotation indicator dots. Default false (subtle by default). */
  indicator?: boolean;
  /** Tailwind classes applied to the outer wrapper — useful for tinting or blending. */
  className?: string;
  /** CSS filter on the image layer. Defaults to none. Pass "grayscale" or similar for moodier looks. */
  imageFilter?: string;
};

export function RotatingNatureBackdrop({
  images,
  opacity = 0.14,
  rotationMs = 15000,
  mist = true,
  indicator = false,
  className = "",
  imageFilter,
}: Props) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const activeImage = images[index] ?? images[0];

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, rotationMs);
    return () => clearInterval(id);
  }, [count, rotationMs]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Preload all images so cross-fades have no gap */}
      <div className="hidden">
        {images.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>

      {/* Cross-fading image layer */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeImage}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.6, ease: "easeInOut" } }}
          className="absolute inset-0"
          style={{ filter: imageFilter }}
        >
          {/* Continuous slow Ken Burns — independent of the fade */}
          <motion.div
            initial={{ scale: 1.06 }}
            animate={{
              scale: [1.06, 1.12, 1.06],
              x: [0, -8, 0],
              y: [0, -4, 0],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activeImage})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Drifting mist plume — slow horizontal traversal */}
      {mist && (
        <motion.div
          animate={{
            x: ["-35%", "135%"],
            opacity: [0, 0.25, 0.25, 0],
          }}
          transition={{
            duration: 70,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.2, 0.8, 1],
          }}
          className="absolute inset-y-0 w-[55%]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 35%, transparent 65%)",
            filter: "blur(28px)",
          }}
        />
      )}

      {/* Optional rotation dots */}
      {indicator && count > 1 && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i === index ? "w-4 bg-[#c4934e]" : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
