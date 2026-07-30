# AGENTS.md — VOKAL Mobile App

This file gives Gemini 3.6 Flash or Gemini 3.1 Pro the context it needs to work on this repository. Read it before making changes. For anything about visual design, copy tone, or screen structure, also consult `.gemini/skills/vokal-app-design/SKILL.md` — Gemini should load that skill automatically for any UI/design task, but this file points to it explicitly as a backup.

## 1. What this project is

**VOKAL — Verifikasi Otomatis Kloning Audio Lokal** ("Bukan Suaramu, Bukan Uangmu") is a hackathon submission: a mobile app that protects Indonesian families from AI voice-cloning phone scams ("suara anak/ortu minta transfer darurat"). It combines a rotating spoken codeword (TOTP-style), on-device synthetic-voice detection, a pre-upload "Voice Exposure Score," and a gamified family education module ("Akademi VOKAL").

This repository is the **mobile app itself** — not a marketing website. Every screen should feel like a real, usable product, built mobile-first for Android/iOS.

The full feature/content source of truth is `docs/content-outline.md`. When in doubt about what a feature does, defer to that document rather than inventing new functionality.

## 2. Tech stack

- **Framework:** React Native with **Expo** (managed workflow), TypeScript
- **Navigation:** React Navigation (native-stack + bottom-tabs)
- **Styling:** **NativeWind** (Tailwind CSS for React Native) — style everything with `className`, utility-first. No `StyleSheet.create`, no inline style objects, no CSS-in-JS libraries, except for the rare case NativeWind can't express something (document why, inline, if that happens).
- **Design tokens:** defined once in `tailwind.config.js` (`theme.extend.colors`, `fontSize`, `spacing`) — components reference token names (`bg-mustard`, `text-terracotta`, `bg-olive`, `bg-espresso`), never raw hex values or magic numbers in `className` strings.
- **Animation:** `react-native-reanimated` for the small set of animated demo widgets (risk meter, codeword rotation) — used for polish only, never load-bearing for functionality
- **Icons:** `lucide-react-native`
- **State:** React state/hooks + Context for family/session data; no backend calls required for the competition build — see §5 for what's real vs. simulated
- **Fonts:** loaded via `expo-font`, registered in `tailwind.config.js` `fontFamily`
- **Target:** Android + iOS via Expo Go for demoing; no native modules that would break Expo Go unless explicitly required

## 3. Repository structure

```
/
├── CLAUDE.md                     — this file
├── .claude/skills/
│   └── vokal-app-design/
│       └── SKILL.md              — visual design system + screen blueprint
├── docs/
│   └── content-outline.md        — screen-by-screen copy source
├── App.tsx                       — app entry, navigation container
├── app.json                      — Expo config (app name: VOKAL)
├── tailwind.config.js            — design tokens (colors, type scale, spacing, fonts)
├── global.css                    — Tailwind directives (NativeWind entry point)
├── babel.config.js               — NativeWind babel preset
├── metro.config.js               — NativeWind metro config
├── src/
│   ├── navigation/                — stack/tab navigators
│   ├── screens/                   — one folder per screen (Onboarding, FamilySetup, Home,
│   │                                 IncomingCallCheck, VoiceExposureScan, AkademiVokal,
│   │                                 PracticeCall, ScamStory, Quiz, Certificate, Profile,
│   │                                 ElderlyMode)
│   ├── components/
│   │   ├── ui/                    — reusable primitives (Card, Badge, Button, Toggle, Stat,
│   │   │                             ProgressTrack, Accordion), all styled via `className`
│   │   └── demo/                  — simulated-behavior widgets (risk meter, codeword rotator)
│   ├── data/                       — mock/sample data (sample transcripts, sample audio labels,
│   │                                 persona data, academy content)
│   └── assets/                    — icons, illustrations, fonts
└── package.json
```

New screens/components go inside this structure — don't invent a parallel layout.

## 4. Conventions

- **Code and comments in English.** User-facing copy is in **Bahasa Indonesia** (this is an Indonesian competition, for an Indonesian audience — do not translate the copy to English unless explicitly asked).
- **Component/screen files:** PascalCase, one screen per folder (`screens/Home/HomeScreen.tsx`), colocate screen-specific sub-components inside that screen's folder if they're not reused elsewhere.
- **Styling:** always use NativeWind `className` with token names from `tailwind.config.js` (e.g. `className="bg-mustard px-8 py-4 rounded-full"`), never hardcode hex values or raw pixel numbers. For conditional/dynamic styles, compose className strings (e.g. with a small `clsx`/`cn` helper) rather than falling back to inline `style` objects. See `.claude/skills/vokal-app-design/SKILL.md` §4 for the full color token list (warm cream/mustard/terracotta/olive/espresso palette).
- **Accessibility is a first-class requirement, not a nice-to-have** — this product's core audience includes elderly users. Every touchable needs a minimum 44×44pt hit target (`min-h-11 min-w-11` or larger), sufficient color contrast (WCAG AA), and a `Mode Lansia` variant must remain genuinely usable, not just a cosmetic toggle.
- **Mobile-first and thumb-friendly.** Primary actions live within easy thumb reach (bottom of screen), not just top app-bar buttons.
- Keep components small and composable; prefer several focused screen components over one giant screen file.

## 5. Guardrails — read before implementing "real" vs "simulated" features

This is a hackathon build, so:

- Any feature that would require a production ML pipeline or real telephony integration (live call audio interception, a fully trained/deployed on-device synthetic-voice classifier, real bank transaction holds) should be implemented against **local sample/mock data** clearly reachable through the demo flow, not faked as if it's live. Label these clearly in-UI as "Simulasi" / "Mode Demo" where the underlying behavior is mocked (e.g. record-then-analyze instead of true continuous real-time, if full real-time isn't feasible in the build).
- The **Family Codeword Vault** (TOTP-style codeword) can and should be implemented for real — it's pure client-side crypto/logic and doesn't need an ML model or backend.
- Don't fabricate statistics, news citations, or quotes about voice-cloning fraud that aren't already in `docs/content-outline.md`. If a stat isn't sourced, phrase it qualitatively instead of inventing a number.
- Don't use real photos of identifiable people (especially elderly people, to avoid implying a real victim). Use illustrations, abstract shapes, or icon-based avatars instead — the design skill has guidance on this.
- Don't imply VOKAL is already published/available on app stores if it isn't — this is a competition build.

## 6. Common commands

```bash
npm install
npx expo start        # start the dev server / Expo Go
npx expo start --android
npx expo start --ios
npm run lint
```

## 7. When starting any UI task

1. Check `docs/content-outline.md` for the copy/content for that screen.
2. Load `.claude/skills/vokal-app-design/SKILL.md` for colors, type scale, spacing, and component patterns.
3. Style everything with NativeWind `className`, pulling values from `tailwind.config.js` tokens.
4. Build against real device dimensions (mobile-first, test both a small and large phone size).
5. Confirm any simulated/mocked behavior is labeled per §5.
