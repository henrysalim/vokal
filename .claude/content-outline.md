# Content Outline — Source of Truth for App Copy

All copy below is the approved Bahasa Indonesia source text/talking points for each screen — pull from here rather than paraphrasing from memory. Update this file whenever the product proposal changes.

## Brand
- Name: **VOKAL** — *Verifikasi Otomatis Kloning Audio Lokal*
- Tagline: **"Bukan Suaramu, Bukan Uangmu"**
- Theme/Subtheme: Keamanan Siber • Kecerdasan Buatan untuk Privasi • Edukasi & Literasi Digital
- One-sentence value prop: Aplikasi yang melindungi keluarga Indonesia dari penipuan telepon berbasis kloning suara AI, tanpa pernah mengirim suara Anda ke server manapun.

## Problem Statement
- Voice cloning AI can mimic a person's voice from a few seconds of public audio (birthday videos, WhatsApp stories, TikTok clips).
- Scammers use cloned voices to call family members claiming an emergency, pressuring for an urgent transfer.
- Existing anti-spam apps (Truecaller-style) only verify the phone number, not the voice itself — spoofed/new numbers bypass them entirely.
- Most vulnerable group: elderly parents, who are less familiar with AI and more likely to act on emotion under perceived urgency.

## How It Works — 4 Layers
1. **Family Codeword Vault** (kriptografi) — TOTP-style spoken codeword, rotates daily, offline-first, end-to-end encrypted.
2. **On-device Synthetic Voice Detection** (AI privasi) — TFLite model (AASIST/RawNet2-based) runs locally, flags acoustic artifacts of synthetic speech in real time, no audio ever leaves the device.
3. **Voice Exposure Score** (preventif) — scores how "cloneable" a video is before you post it publicly, suggests mitigations (background music, trimming clean speech).
4. **Akademi VOKAL** (edukasi/gamifikasi) — turns family security habits into an ongoing game.

## Secondary Features
- **Cooling-off Timer** — full-screen 60-second pause prompt when high-risk keywords + high synthetic-voice score coincide.
- **Family Trust Graph** — multi-level family network (parents–children–grandchildren–in-laws), not just 1-on-1.
- **Silent Alarm** — quiet notification to other verified family members if a call continues despite a high risk score.
- **Offline-first Codeword** — works with zero internet connection.
- **Mode Lansia** — large-font, single-button, voice-guided interface for elderly users.

## Akademi VOKAL — Gamification Detail
- Levels: **Newbie Guardian → Voice Detective → Family Protector → VOKAL Master**
- XP sources: completing simulation modules, correctly spotting a practice suspicious call, setting up first codeword, inviting a family member.
- **Practice Call simulation** — family members roleplay scam scenarios; app scores accuracy and reaction time.
- **Scam Story interactive fiction** — short branching stories with visible consequences per choice.
- **"Asli atau Kloningan?" quiz** — practice distinguishing synthesized vs. genuine sample audio.
- **Weekly family challenges & leaderboard** — friendly competition between families/neighborhoods (RT).
- **Digital certificate** — "Keluarga Anti-Scam," awarded once all family members finish the base modules, shareable.
- **Daily streak** — lightweight reminder to check today's codeword.
- **Community/classroom mode** — ready-made materials for teachers/RT-RW organizers.

## User Personas
| Persona | Age | Need | Pain point |
|---|---|---|---|
| Bu Yanti — Ibu Rumah Tangga Lansia | 60–75 | Simple way to verify an "emergency" call from child/grandchild | Unfamiliar with AI terms, panics easily, complex UI is a barrier |
| Andi — Perantau Muda Bekerja | 22–35 | Keep parents back home safe while living far away | Can't always be reached quickly when a parent gets a suspicious call |
| Keluarga Besar (Family Admin) | 30–50 | Manage protection for many family members from one place | Hard to ensure every relative (in-laws included) is covered |
| Guru/Penggerak Komunitas RT-RW | 25–55 | Ready-to-use materials for community digital-safety sessions | Lack of interactive, cross-age-friendly education material |

## Impact (expected outcomes)
- Lower financial losses from voice-cloning scams via fast, reliable verification.
- Improved cross-generational digital literacy, especially for elderly users underserved by conventional cybersecurity education.
- A collaborative family "watch out for each other" culture instead of isolated individual protection.
- Verification as a habit/reflex, not a one-time lesson, via sustained gamification.
- Contribution to broader public awareness of AI-generative-tech misuse risks in Indonesia.

## Tech Stack (for an About/technical screen, judge-facing)
- Mobile: **React Native (Expo)**, TypeScript, **NativeWind** for styling, dedicated Mode Lansia theme variant
- On-device AI: AASIST / RawNet2 (ASVspoof-lineage), optionally Wav2Vec2-based SSL variant, converted via ONNX → TensorFlow Lite
- Crypto: modified TOTP (RFC 6238) producing spoken words, AES-256 end-to-end encryption
- Backend (minimal, if used): Firebase/Node.js for encrypted metadata sync + push notifications only — never raw audio
- Gamification: Firestore/Realtime DB (or local state for the competition build) for points, badges, leaderboard

## Roadmap (mention briefly, e.g. an "apa selanjutnya" strip in Settings/About — not a full screen)
- Crowdsourced scam-number blocklist
- Bank collaboration for automatic transaction hold on high-risk-flagged calls
- Telco-level number-spoofing signals
- Regional-language voice guidance for Mode Lansia
- Open education API for schools/NGOs
- Adaptive on-device model updates as cloning techniques evolve

## Team
Placeholder — pull directly from the proposal's Team table once finalized. Do not invent names.
