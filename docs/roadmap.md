# Roadmap

Each phase ships fully working and gets verified (build, tests, a manual
click-through, and — for anything mic-related — a live check on a real
device) before the next one starts.

| Phase | Scope | Status |
|---|---|---|
| 0 | Rebrand from the abandoned SAT-prep idea: kept the auth system and deployment infra, stripped everything SAT-specific | ✅ Done |
| 1 | Core recording + live feedback: mic capture, live Deepgram transcription, live WPM/filler/pause tracking, session storage, Claude-generated coaching report | In progress |
| 2 | Practice modes: mode-specific prompts (impromptu, interview, debate, presentation, elevator pitch, etc.), AI-generated prompts | Planned |
| 3 | Session history + analytics dashboard: past sessions, trend charts, weakest/strongest skills | Planned |
| 4 | Gamification: XP, levels, coins, streaks, achievements | Planned |
| 5 | Speech library: communication techniques (Rule of Three, PREP, Monroe's Motivated Sequence, etc.) with interactive exercises; curated example-speech excerpts focused on technique, not imitation | Planned |
| 6 | Daily exercises: tongue twisters, breathing drills, timed challenges | Planned |
| 7 | AI speech generator: Claude-generated practice speeches by topic/audience/tone | Planned |
| 8 | Profile, settings, accessibility polish, privacy controls (recording deletion, clear storage-vs-local-processing disclosure) | Planned |
| 9 | Future/deferred: webcam posture & eye contact, gesture analysis, VR mode, mobile app | Not started — deliberately out of scope until the core product is solid |

See [architecture.md](./architecture.md) for the technical design (especially
the real-time-audio-on-serverless approach) and
[database-schema.md](./database-schema.md) / [api-spec.md](./api-spec.md)
for what's implemented vs. planned per domain.
