## Packages
framer-motion | Page transitions and gamified animations
canvas-confetti | Celebration effects for completing lessons
@types/canvas-confetti | Types for canvas-confetti
date-fns | Formatting dates for live classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
Colors should use the CSS variables defined in index.css.
The app relies on the provided Replit Auth hook `useAuth` at `@/hooks/use-auth` and endpoints from `@shared/routes`.
