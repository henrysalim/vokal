---
name: vokal-app-design
description: Use this skill whenever building, styling, editing, or reviewing any screen or component for the VOKAL mobile app — including onboarding, the family codeword setup, the incoming-call risk check, the Voice Exposure Score scanner, the Akademi VOKAL gamification screens, persona/profile screens, Mode Lansia, or any new screen added to the app. Also use it when writing or editing in-app copy, choosing colors/icons/illustrations, or deciding how a new feature should be represented as a screen or component. Trigger this proactively for any "build this screen," "add a screen," "style this component," or "make this look better" request in this repo — don't wait for the user to ask for "design guidance" explicitly.
---

# VOKAL App Design & Content Skill

This skill is the single source of truth for how the VOKAL app looks, sounds, and is structured. It exists so every screen — however small — feels like it belongs to the same product, instead of looking like disconnected AI-generated screens.

## 1. Brand personality

VOKAL protects families — especially elderly parents — from a very frightening, very personal scam. The visual language is warm, human, and a little playful (think a well-designed wellness/journaling app, not a stern antivirus dashboard), because a friendly, approachable feeling is what actually gets a nervous or less tech-savvy user to trust and use a security app. The app must feel:

- **Warm and reassuring, not alarmist.** The threat (voice cloning fraud) is real and should be explained clearly, but the dominant emotional register is "we've got your family covered," not "be terrified of AI."
- **Human and a little playful**, like a wellness or journaling app — soft warm colors, big friendly numbers, rounded pill shapes, a touch of illustrated character — rather than the cold blues/dark-mode-hacker look most security apps default to.
- **Cross-generational.** Visual and copy choices should work for a 25-year-old and for a 65-year-old parent. When in doubt, favor the more legible, less trendy option — and remember Mode Lansia isn't a side feature, it's core to the product's promise.

Avoid: horror-movie imagery, glitch/hacker clichés (green matrix text, skulls, hooded figures), fear-based copy ("KELUARGA ANDA DALAM BAHAYA SEKARANG"). Prefer calm confidence over urgency, except inside the deliberately urgent Cooling-off Timer moment, which is allowed to feel more serious/alert since it's a genuine safety interstitial.

## 2. Name & identity

- Full name: **VOKAL** — *Verifikasi Otomatis Kloning Audio Lokal*
- Tagline: **"Bukan Suaramu, Bukan Uangmu"**
- Always render the name as **VOKAL** (all caps) in UI — it's an acronym, not a stylized wordmark.
- On first launch / About screen, spell out the full acronym once so users understand what it stands for; everywhere else, just "VOKAL" is fine.
- Visual mark: a shield + sound-wave motif, drawn in a soft, rounded, slightly friendly illustration style (not a hard corporate crest) — reuse across app icon, splash screen, onboarding, and empty states. A simple friendly "shield character" (a shield shape with a small smiling sound-wave/face detail, in the spirit of a warm mascot) is encouraged for onboarding and empty states, similar in tone to a smiling sun or friendly bot mascot — never a menacing or clinical shield.

## 3. Styling approach — NativeWind

All styling is done with **NativeWind** (`className` props), not `StyleSheet.create` or inline style objects.

- Design tokens live in `tailwind.config.js` under `theme.extend` — colors, `fontSize`, `spacing`, `fontFamily`. Components reference token names only.
- Compose utility classes directly in JSX: `className="bg-espresso px-5 py-4 rounded-2xl"`.
- For conditional styling, build the className string with a small helper (e.g. `cn(...)` / `clsx`) rather than branching into inline `style` props.
- Custom values that don't fit the token scale should be added to `tailwind.config.js` rather than used as one-off arbitrary values (`className="p-[13px]"`) — keep the scale consistent app-wide.

## 4. Color tokens (`tailwind.config.js`)

Warm, earthy, wellness-app palette — cream base with mustard as the hero accent, terracotta and olive as supporting accents, and a near-black anchor color for high-contrast text. No blue, no navy, no cold "cybersecurity" tones. **Every hex below is sampled directly, pixel-for-pixel, from the reference screenshot** (not an approximation), so this is the exact palette to reproduce.

| Token | Hex | Use |
|---|---|---|
| `espresso` | `#1A1512` | Anchor dark color — headers on colored cards, primary buttons/text on light backgrounds, bottom-nav icons, high-contrast surfaces. Sampled from the reference's heading text and nav icons — it reads as near-black, not chocolate-brown — `bg-espresso` / `text-espresso` |
| `mustard` | `#F5BE4E` | Hero accent — primary CTAs, the center FAB, progress-track highlights. Sampled from the reference's FAB and selected day-chip — `bg-mustard` / `text-mustard` |
| `mustard-soft` | `#F6CC6A` | Lighter tint used specifically for hero/highlight card fills (e.g. today's codeword card) — a paler, softer version of `mustard`, sampled from the reference's "Let's start your day" hero card. Don't substitute plain `mustard` here; the reference genuinely uses two distinct shades — `bg-mustard-soft` |
| `terracotta` | `#C1592E` | Secondary accent — secondary buttons, active tags/icons. Not present as a bold solid anywhere in the reference screenshot, so this stays as the existing VOKAL brand choice — `bg-terracotta` / `text-terracotta` |
| `rose` | `#EFD4CF` | Pastel card-fill color for quick-action cards (e.g. "Cek Suara Ini" card). Sampled from the reference's "Pause & reflect" card — use as a full card background, not an opacity tint — `bg-rose` |
| `lavender` | `#DFD9FC` | Pastel card-fill color for quick-action cards. Sampled from the reference's "Set Intentions" card — pairs with `rose` and `taupe` for the rotating quick-action row — `bg-lavender` |
| `taupe` | `#CFC5BA` | Muted secondary panel color (e.g. a collapsed/secondary tab or side panel). Sampled from the reference's "Evening" side tab — `bg-taupe` |
| `olive` | `#74822F` | Tertiary accent, and the **verified / safe / calm** semantic color ("suara asli terverifikasi"). Not present in the reference screenshot, so this stays as the existing VOKAL brand choice — `bg-olive` / `text-olive` |
| `cream` | `#DEDADA` | Default app/screen background. Sampled from the reference — it's a cool warm-grey, notably less yellow/tan than a typical "cream" — `bg-cream` |
| `surface` | `#FFFFFF` | Card surface used for contrast against `cream` (e.g. the risk-meter card, journal-style content cards, white pill tags). Confirmed exact match against the reference — `bg-surface` |
| `text-muted` | `#6E5751` | Secondary/supporting text — a warm grey-brown, never a cold grey. Sampled from the reference's "Today" labels — `text-text-muted` |
| `warning` | `#7A2E28` | **High-risk / suspicious-call** state only — a deep brick/maroon that stays inside the warm palette family but reads as serious. Not present in the reference (it has no error/danger state to sample), so this stays as the existing VOKAL brand choice. Reserve strictly for the risk-detection UI and the Cooling-off Timer; never use for general chrome — `bg-warning` / `text-warning` |

Guidance on use:
- `mustard` is the app's "star" color — used generously for primary CTAs and highlight cards, the way it's used for the FAB and day-selector in the reference style. It is not a sparing accent the way gold was in earlier versions of this palette. Use `mustard-soft` specifically for hero card *fills* and `mustard` for FABs, buttons, and selected-state chips — the reference does not use them interchangeably.
- For the quick-action card row (§6, §8), use `rose`, `lavender`, and `taupe` as solid full-card fills — this is a literal, exact match to the reference's "Pause & reflect" / "Set Intentions" / "Evening" cards, replacing any earlier opacity-tint approach (`bg-terracotta/10` etc.) for that specific pattern.
- Because `mustard`, `mustard-soft`, `terracotta`, `rose`, `lavender`, and `taupe` are all light-to-mid brightness, don't put small body text directly on them in a clashing color — pair with `espresso` (near-black) or white text on solid fills, and reserve `mustard`/`terracotta` as *text* color only for larger headings on `cream`/`surface` backgrounds (check contrast per §11).
- `warning` (brick/maroon) must stay visually distinct from `terracotta` — don't let a risk-alert accidentally read as just "another accent color."

## 5. Typography

- Headings: a confident, rounded, friendly sans-serif (e.g. `Nunito`, `Quicksand`, or `Plus Jakarta Sans`), registered in `tailwind.config.js` under `fontFamily.heading` — weight 700/800 for screen titles, 600 for section headers.
- Body: a highly legible humanist sans-serif (e.g. `Inter` or `Source Sans 3`), registered as `fontFamily.body`, at minimum 16pt, 18pt preferred given the older-audience requirement.
- Line height: 1.4–1.5 for body text (`leading-relaxed`) — don't compress for density.
- Type scale (Tailwind size tokens): screen title `text-2xl`/`text-3xl`, section header `text-lg`/`text-xl`, body `text-base` (18pt in Mode Lansia), caption `text-xs` minimum — never go smaller.
- **Big stat numbers**: for XP totals, streak counts, or a codeword countdown, use an oversized bold numeral (`text-5xl`/`text-6xl`, weight 800, `text-espresso`) as its own visual moment on the screen — this is a signature pattern of the reference style (e.g. a big "420" or "1571" as the focal point of a card) and should be reused for VOKAL's own big numbers: total XP, days protected, family members verified, streak count.
- **Mode Lansia** scales the entire type scale up by roughly 25–30% and increases line height further — implement this as a real alternate token set / conditional className mapping, not a fake toggle.

## 6. Layout & spacing

- 8pt base spacing unit (Tailwind's default `4`-based scale maps cleanly — `p-2` = 8pt, etc.); screen padding: `px-5 pt-6`.
- **Content cards**: `rounded-2xl` (soft shadow `shadow-md` at rest), `bg-surface` on a `bg-cream` screen — mirrors the white-card-on-warm-background pattern from the reference.
- **Primary CTA buttons**: fully rounded pills (`rounded-full`), generous horizontal padding (`px-8 py-4`), solid `bg-mustard` or `bg-espresso` fill with bold white/espresso text — not the more conservative `rounded-2xl` button used for secondary/tertiary actions.
- **Hero/highlight cards** (e.g. "Codeword Hari Ini", a featured Akademi VOKAL module): large `rounded-3xl` card with a solid or softly-illustrated `mustard` background, big friendly headline, and an optional simple illustration — same role as the "Let's start your day" hero card in the reference.
- **Quick-action grid**: a horizontal row/grid of small cards in rotating solid pastel fills (`rose`, `lavender`, `taupe`, and `mustard-soft`) for shortcuts like "Cek Suara Ini", "Atur Codeword", "Latihan Keluarga" — an exact match to the "Pause & reflect" / "Set Intentions" quick-journal card row, using the same flat pastel fills rather than opacity tints of the bold accent colors.
- Primary actions anchor near the bottom of the screen (thumb zone), not just in a top app bar.
- **Bottom navigation**: a rounded pill/floating tab bar with 4 standard destinations (Home, Akademi VOKAL, Keluarga, Profil) plus a raised circular **mustard FAB** in the center for the single most important action, "Cek Suara Ini" — directly mirroring the center "+" FAB pattern in the reference navigation bar. Not a hamburger drawer — this needs to be fast and obvious for less tech-savvy users.
- **Circular day/date selector**: a horizontal row of circular day chips (like a weekly calendar strip) with the selected day filled in `mustard` — reuse this pattern for the Akademi VOKAL daily-streak view and the "codeword rotates today" indicator.

## 7. Screen map

1. **Onboarding** — 3–4 short slides explaining the problem and the 4 protection layers, ending in account/family setup. Icon-led, minimal text per slide, friendly shield mascot illustration.
2. **Family Setup** — create or join a family, set the shared secret for the codeword, assign roles in the Family Trust Graph (orang tua, anak, cucu, menantu, dst.), each with a notification-access level.
3. **Home Dashboard** — greeting header ("Hi, [Nama]" style), circular day-strip, a mustard hero card for today's codeword status, a quick-action card row ("Cek Suara Ini", "Atur Codeword", "Latihan Keluarga"), Akademi VOKAL progress snippet, bottom nav with center FAB.
4. **Incoming Call / Risk Check** — the core interaction: live (or record-then-analyze, per MVP scope) risk meter styled as the rounded pill-bar pattern (see §8), codeword prompt, and the Cooling-off Timer interstitial when risk keywords + high synthetic-voice score coincide together.
5. **Voice Exposure Score / Scanner** — pick or record a video/audio clip before posting publicly, see the exposure score (big stat number + pill-bar breakdown) and mitigation suggestions.
6. **Akademi VOKAL** — hub screen with a big stat number for total XP, level progress track (Newbie Guardian → Voice Detective → Family Protector → VOKAL Master), entry points to Practice Call, Scam Story, and the "Asli atau Kloningan?" quiz, plus the weekly family leaderboard and digital certificate.
7. **Practice Call** — roleplay simulation flow with a scored outcome screen.
8. **Scam Story** — branching short-story reader with a choice screen and a consequence screen.
9. **Quiz ("Asli atau Kloningan?")** — sample-audio-based quiz with immediate feedback.
10. **Family / Trust Graph management** — view/edit family members, roles, Silent Alarm recipients.
11. **Profile & Settings** — Mode Lansia toggle, notification preferences, language, About VOKAL (acronym spelled out here).
12. **Certificate** — shareable "Keluarga Anti-Scam" certificate screen once a family completes base modules.

## 8. Component patterns

- **Feature/summary card:** icon in a soft-tinted circle (`bg-terracotta/10` or `bg-olive/10`), title, 1–2 sentence body, optional small "Lapis 1/2/3/4" tag.
- **Big stat display:** oversized bold numeral (see §5) with a short supporting line beneath it — the primary way VOKAL shows XP, streaks, and scores. Use on Home, Akademi VOKAL hub, and the Voice Exposure Score result screen.
- **Pill-bar breakdown chart:** vertical rounded-capsule bars (like the reference "Emotions" chart) used for the risk breakdown or quiz-accuracy breakdown — one bar per category, filled proportionally, percentage label above, category label below. Use `mustard`, `terracotta`, `olive`, and `espresso` as the four bar colors when there are four categories; fall back to `olive`→`warning` as a two-color gradient specifically for the single-value risk meter on the Incoming Call screen.
- **Risk meter (Incoming Call screen):** a horizontal or vertical pill-bar from `olive` (asli/genuine) to `warning` (kemungkinan sintetis tinggi), driven by sample/mock states per CLAUDE.md §5 unless real inference is wired up — always show a small "Simulasi — data contoh" label when using mock data.
- **Progress track (Akademi VOKAL levels, onboarding steps):** horizontal on wide screens, vertical stack on standard phone width, connected by a thin line, each node a circle with an icon or number, current node highlighted with `bg-mustard`.
- **Badge/lencana:** small rounded-shield icon, `mustard` or `terracotta` accent, used only inside Akademi VOKAL so it keeps its "reward" meaning — don't reuse the badge visual for anything else.
- **Quick-action card:** small rounded (`rounded-2xl`) card, solid `rose` / `lavender` / `taupe` / `mustard-soft` background (rotating), bold short title in `espresso`, icon top-right, used in horizontal-scroll rows on Home — direct, exact-color equivalent of the reference's "Pause & reflect" / "Set Intentions" cards.
- **Circular day/date chip:** small circle, `text-muted` label above, filled `bg-mustard` + white text when selected/today, outlined/neutral otherwise.
- **Cooling-off Timer interstitial:** full-screen modal, warm-but-serious tone (not panicked), large countdown using the big-stat-number style in `warning` or `espresso`, one clear primary pill-button action ("Tarik napas, saya akan hubungi ulang").
- **Custom Global Confirm Modal (`ConfirmModal`):** Reusable custom modal dialog component (`src/components/ui/ConfirmModal.tsx`) replacing OS native `Alert.alert`. Features smooth Reanimated zoom/backdrop transitions, 5 color variants (`mustard`, `terracotta`, `olive`, `espresso`, `info`), preset icons (`share`, `warning`, `danger`, `success`, `info`, `question`), and global invocation via the `useConfirmModal()` hook and `ConfirmModalProvider`.
- **Accordion:** simple expand/collapse with a rotating chevron, used for FAQ/help content only.

## 9. Copy guidelines

- All user-facing copy is in **Bahasa Indonesia**, keeping product-feature names as proper nouns where established ("codeword," "cooling-off timer," "Family Trust Graph," "Silent Alarm") but surrounding sentences in Indonesian.
- Keep sentences short, active voice. Avoid jargon in onboarding and the Home dashboard; technical terms (TOTP, on-device inference, ONNX/TFLite) belong in About/Settings or a "how it works, technically" screen for curious/judge users, not the main flow.
- Never invent new statistics or news claims. If a stat isn't in `docs/content-outline.md`, phrase it qualitatively ("kasus semacam ini semakin sering diberitakan") instead of asserting a number.
- Button labels: action + calm, e.g. "Cek Suara Ini", "Mulai Simulasi", "Atur Codeword Keluarga" — avoid manufactured urgency like "Lindungi Sekarang Sebelum Terlambat!". The one deliberate exception is the Cooling-off Timer's own copy, which is allowed to feel more serious.

## 10. Imagery & icons

- Use icon-based, illustrated visuals (`lucide-react-native` icons, simple flat/abstract illustrations in the warm palette) rather than photography.
- A friendly illustrated mascot (the smiling shield motif, see §2) is encouraged for onboarding, empty states, and celebratory moments (e.g. certificate earned) — keep it simple and flat, in the same warm palette, never realistic or uncanny.
- No real or AI-generated photos of identifiable people, and especially avoid anything that could read as depicting a real elderly scam victim — keep personas/avatars abstract (initials-in-a-circle, or simple flat-illustration figures) rather than photographic avatars.
- No copyrighted logos or third-party brand marks.
- Reuse the shield + sound-wave motif and the warm color set consistently (app icon, splash screen, onboarding, Akademi VOKAL badges) rather than introducing unrelated iconography or off-palette colors per screen.

## 11. Accessibility requirements (non-negotiable)

- Minimum WCAG AA contrast for all text/background pairs — because `mustard` and `terracotta` are mid-brightness, always verify actual contrast ratios for any text placed on them (prefer `espresso` or white text on solid fills; avoid `mustard`/`terracotta` text directly on `cream`).
- Every touchable needs a minimum 44×44pt hit target (`min-h-11 min-w-11` or larger via className) and a visible pressed/focus state.
- **Mode Lansia** must be a fully functional variant (larger type scale, simplified single-primary-action layouts, optional voice-guided prompts via `expo-speech` or similar) — not a cosmetic-only toggle.
- Respect reduced-motion device settings for any Reanimated animations; provide a static fallback.
- Support Android/iOS system font-scaling gracefully — layouts shouldn't break when a user has increased their OS-level text size.
