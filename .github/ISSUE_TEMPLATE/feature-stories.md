---
name: "Feature: Instagram-style Stories"
about: Track delivery of full Stories system (web, mobile, backend, infra)
labels: feature, epic, stories
---

# Epic: Instagram-style Stories

## Phase 0 – Foundations
- [ ] Confirm product scope and parity targets
- [ ] Pick DB (Neon/Supabase) and Storage (S3/Supabase)
- [ ] Auth decision (Supabase/Firebase/JWT) and token flows
- [ ] Monitoring (Sentry), metrics, logging baseline

## Phase 1 – Backend MVP (v1)
- [ ] REST: POST /api/v1/stories/compose (multi-item)
- [ ] REST: GET /api/v1/stories/viewer-feed (segments grouped by user)
- [ ] REST: POST /api/v1/stories/:story_item_id/view
- [ ] REST: GET /api/v1/stories/:user_id/viewers (owner)
- [ ] Rate limit & auth guards
- [ ] File-backed storage fallback

## Phase 2 – Media Pipeline
- [ ] Presigned upload (S3) + size/duration checks
- [ ] Background transcode (h264/webm), thumbnails/posters
- [ ] CDN (CloudFront) + cache headers

## Phase 3 – Web Frontend
- [ ] Tray UI (rings: unseen/seen/muted/close-friends)
- [ ] Viewer (tap/long-press/swipe, progress bars)
- [ ] Composer (camera/gallery, text, stickers)
- [ ] Reactions + replies UI
- [ ] Highlights & Archive UI

## Phase 4 – Mobile (React Native)
- [ ] Shared design system + component parity
- [ ] Camera/recording, gestures, animations

## Phase 5 – Realtime & Notifications
- [ ] WebSocket for views/reactions/replies
- [ ] Push notifications (opt-in)

## Phase 6 – Privacy/Moderation
- [ ] Privacy: public/followers/close-friends
- [ ] Report flow, content scanning, NSFW blur

## Phase 7 – Analytics & QA
- [ ] Viewer analytics (unique, completion rate)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load tests (k6)

## Phase 8 – Infra & CI/CD
- [ ] Terraform (S3, CloudFront, RDS/Neon, Redis)
- [ ] GitHub Actions: test, build, deploy
- [ ] Rollout via feature flags

## Acceptance
- [ ] UX parity with Instagram behaviors
- [ ] Stories expire in 24h & archive
- [ ] Realtime updates < 2s; API p50 < 500ms
