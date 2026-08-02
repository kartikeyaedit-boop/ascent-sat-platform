# Roadmap

Each phase ships fully working, not a shallow skeleton, and is verified
end-to-end (build, tests, and a manual click-through) before the next one
starts.

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffolding: Next.js/TS/Tailwind/shadcn, Prisma, tooling | ✅ Done |
| 1 | Auth (email/password, verification, reset, JWT+refresh) + app shell, landing page, About the Creator page | ✅ Done |
| 2 | Gamification core: XP/levels/coins/streaks, daily quests, achievements (~40-50 to start, built to extend to 300+), notifications | Next |
| 3 | Math content engine: question model, renderer (incl. LaTeX), Algebra + Geometry modules with real questions, practice sessions | Planned |
| 4 | Reading & Writing module: passages, grammar/rhetoric questions | Planned |
| 5 | Full digital SAT practice tests: timed sections, flagging, review mode, score estimate | Planned |
| 6 | Profile / Store / Achievements / Leaderboard / Analytics pages | Planned |
| 7 | Social: friends, requests, private leaderboard, notifications feed | Planned |
| 8 | Admin panel: user/question/achievement/quest management | Planned |
| 9 | AI features (Claude API): tutor, hints, study plans, mistake analysis, motivational coach | Planned |
| 10 | Testing hardening + deployment (Docker, Vercel/Railway, full docs) | Planned |

Remaining Math topics (Functions, Quadratics, Exponents/Radicals,
Polynomials, Systems, Trigonometry, Statistics/Probability, Percent/Ratios,
Data Analysis, etc.) and the rest of the 300+ achievements are added as
content on top of the Phase 2/3 engines in follow-up passes — the engine is
built once, content scales incrementally after.

See [architecture.md](./architecture.md) for the technical design and
[database-schema.md](./database-schema.md) / [api-spec.md](./api-spec.md)
for what's implemented vs. planned per domain.
