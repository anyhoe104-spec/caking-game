# Project worklog

This file is the shared source of truth for cross-device and cross-agent handoffs. Keep the current handoff concise and preserve dated reports as an append-only history.

## Current handoff

- Updated: 2026-08-31 23:23 +0900 (Asia/Tokyo)
- Agent: Claude Code
- Branch: `claude/caking-weekly-improvements-bg3gnf`
- Objective: Weekly improvement pass (UI, audio, animation), a voice quality pass, host-independent builds,
  then settling the monetisation-adjacent decisions and preparing the Cloudflare Pages move.
- Completed:
  - UI overhaul, full audio layer (5 scene BGM loops, 15 SE, 9 voice cues, per-channel mute and volume),
    motion layer with a reduced-motion switch.
  - Voice synthesiser rework: formant transitions, Japanese vowel devoicing, corrected glottal slope.
  - Host-independent build. The same source builds for GitHub Pages and for a root-serving host;
    Cloudflare Pages and Netlify need no build configuration.
  - Fixed a pre-existing PWA defect where an offline relaunch rendered a blank page.
  - `scripts/import_audio.py` for bringing externally produced audio in without breaking the loop points.
  - Decisions recorded: free distribution with a tip jar, MIT for code with assets rights-reserved,
    stay public for now, keep the generated audio until a listening test justifies replacing it.
  - `LICENSE`, `LICENSE-ASSETS.md`, and the Cloudflare Pages migration runbook.
- In progress:
  - Nothing outstanding on this branch.
- Blockers and risks:
  - Still no physical-device check. Everything so far is headless Chromium.
  - The copyright holder in `LICENSE` and `LICENSE-ASSETS.md` is the GitHub handle `anyhoe104`.
    Replace it if a real name or brand is preferred before this reaches a wider audience.
  - `public/sounds/` is 2.93 MB; mobile-network load has not been measured.
- Next actions:
  1. Generate one `shop-bgm` candidate in Suno and run the A/B in `docs/audio-generation.md`. That decides
     whether paid audio is adopted, which is also the trigger for going private.
  2. Device check on Android and iOS.
  3. If paid audio is adopted: follow `docs/cloudflare-pages-setup.md`.
- Validation: `npm run lint` clean; `npm test` 16/16 passing; `npm run build` and `npm run build:root` both
  succeed; `git diff --check` clean. Browser runs confirmed the game, the service worker and all audio under
  both `/caking-game/` and `/`, plus an offline relaunch under both.

## Dated work reports

### 2026-08-14 — Codex

- Objective: Create reusable workflows for starting work and ending or handing off work.
- Work completed:
  - Created `$resume-project` to inspect Git and this report before resuming.
  - Created `$checkpoint-project` to update the current handoff and append a dated agent report.
  - Created `$write-work-report` to produce evidence-based articles from this report.
  - Created `AGENTS.md` as a compatible fallback contract for agents without Codex skill support.
  - Designed the report to serve both as a work history and as instructions for another agent.
- Files and areas changed:
  - `.agents/skills/resume-project/`
  - `.agents/skills/checkpoint-project/`
  - `.agents/skills/write-work-report/`
  - `AGENTS.md`
  - `WORKLOG.md`
- Validation:
  - `resume-project`: passed `quick_validate.py`.
  - `checkpoint-project`: passed `quick_validate.py`.
  - `write-work-report`: passed `quick_validate.py`.
  - Repository changes: passed `git diff --check`.
- Decisions:
  - Store the skills inside the repository so GitHub distributes them to both PCs.
  - Remove same-named user-global copies to avoid duplicate skill discovery.
  - Keep current state at the top and append historical reports below.
  - Require explicit authorization before commit or push.
- Unresolved issues:
  - Confirm the skills appear after Codex reloads or starts a new task.
- Next actions:
  1. Inspect the final Git diff.
  2. Commit and push when requested.

### 2026-08-14 15:32 +09:00 — Codex

- Objective: Publish and hand off the shared cross-device and cross-agent workflow.
- Work completed:
  - Committed the repository-scoped workflow as `309e989 Add shared agent handoff workflow`.
  - Pushed `agent/refresh-project-docs` to `origin` and verified the branch is synchronized.
  - Created the private GitHub repository `anyhoe104-spec/agent-project-workflow` as the reusable template source.
  - Added a safe PowerShell installer that refuses to overwrite existing workflow files unless `-Force` is explicitly supplied.
  - Clarified that CAKING development needs only the `caking-game` clone; the template repository is optional for installing the workflow elsewhere.
- Files and areas changed:
  - `AGENTS.md`
  - `WORKLOG.md`
  - `.agents/skills/resume-project/`
  - `.agents/skills/checkpoint-project/`
  - `.agents/skills/write-work-report/`
  - External template repository: `anyhoe104-spec/agent-project-workflow`
- Validation:
  - All three skills passed `quick_validate.py`.
  - `git diff --check` passed before publication.
  - The template installer successfully installed the expected files into a temporary empty Git repository.
  - Local branch and remote branch both pointed to `309e989` before this report update.
- Decisions:
  - Keep project execution rules and skills inside each project repository.
  - Keep reusable source templates in the separate private template repository.
  - Do not require cloning the template repository merely to develop CAKING.
- Unresolved issues:
  - `agent/refresh-project-docs` has not been merged into `main`.
  - Repository-scoped skill discovery has not yet been confirmed on the mobile PC.
- Next actions:
  1. Clone `caking-game` on the mobile PC and switch to `agent/refresh-project-docs`.
  2. Start a new Codex task and invoke `$resume-project`.
  3. Merge the workflow branch into `main` after confirming the desired integration path.

### 2026-08-31 — Claude Code

- Objective: Deliver the weekly improvement request — UI improvements, scene-based BGM, SE and voice feedback,
  and animation — with the audio generation method agreed before implementation.
- Decisions taken with the user before building:
  - Audio generation: hybrid. Synthesise every asset from code now so the feature ships working and
    licence-clean, and ship a documented drop-in replacement path for Suno / ElevenLabs output.
    Chosen because this environment's network policy blocks Suno, ElevenLabs and every stock audio site
    (verified: the proxy returns 403 to CONNECT for those hosts), while PyPI remains reachable.
  - UI scope: full refresh, including restructuring existing screens.
- Work completed:
  - Audio generation (`scripts/generate_audio.py`, `scripts/audio/`): a deterministic synthesiser producing
    5 BGM loops, 15 SE and 9 voice cues as MP3. BGM is written as bar-level chords and melody strings; note
    releases and reverb tails past the final bar are folded back onto bar 1 so loops are seamless. Voice cues
    use Japanese vowel formant synthesis over kana split into morae, with pitch-accent contours.
  - Audio engine (`src/game/audio.js`): Web Audio for gapless BGM looping and gain-based crossfades, with an
    HTMLAudioElement fallback. Loop points come from `public/sounds/manifest.json` so MP3 frame padding does
    not creep into the seam. Gesture unlocking, visibility suspend/resume, lazy per-scene fetching and
    prefetch of the service loop during prep.
  - Audio settings (`src/game/audioSettings.js`): pure, unit-tested model for master/BGM/SE/voice mute and
    volume plus the reduced-motion flag, folding the retired `soundOn` / `bgmOn` flags in on migration.
  - UI: split the 731-line `App.jsx` into an orchestrator plus nine components. Service screen sub-tabs,
    service HUD, orders as shortcuts into the recipe screen, order badges and demand sorting on recipes,
    a settings modal, an animated craft-result card, an opening skip, and a rewritten stylesheet.
  - Animation (`src/animations.css`): screen and list transitions, press feedback, character moods,
    craft result, level-up burst, recipe-unlock sweep, count-up in the daily report, all disabled by
    `.reduceMotion`.
- Files and areas changed:
  - `scripts/generate_audio.py`, `scripts/audio/{synth,music,sfx,voice}.py`
  - `public/sounds/` (29 generated files, manifest, 6 unlicensed files removed), `public/sw.js`
  - `src/App.jsx`, `src/App.css`, `src/animations.css`, `src/index.css`
  - `src/components/` (9 new files), `src/hooks/useCountUp.js`
  - `src/game/{audio,audioAssets,audioSettings,assets,data,storage}.js`
  - `test/game.test.js`
  - `README.md`, `docs/{audio-generation,audio-licenses,audio-sources,current-status}.md`
- Validation:
  - `npm run lint`: clean.
  - `npm test`: 16/16 passing (9 pre-existing, 7 added for audio settings, save migration, scene routing and
    manifest/asset integrity).
  - `npm run build`: succeeds.
  - `git diff --check`: clean.
  - Browser: three scripted Chromium runs at 390x844. Verified the full game loop, every scene's BGM firing in
    order, SE and voice cues at the right events, muting suppressing all audio fetches, reduced motion,
    a v3 save migrating to v4 with mute flags preserved, the recipe-unlock cue, and the ending screen.
    No console or page errors in any run.
  - Audio: BGM sources confirmed to start with `loop = true` and `loopEnd` pinned to the exact musical length.
- Defects fixed in passing:
  - `src/index.css` still carried the Vite template's `prefers-color-scheme: dark` block and a fixed
    1126px `#root` with side borders, which pushed low-contrast text into the game on dark-mode phones.
  - The daily report summed `reward.pts`, but `missions.js` writes `reward.points`, so the mission point
    bonus always displayed as zero.
  - 仕入れ上手のリコ advertised "素材の自然回復 +1" but `regenBonus` was never read by the regen loop.
  - Toast used `white-space: nowrap`, so longer Japanese messages ran off-screen on narrow phones.
  - Duplicated CSS block at the end of `App.css`; duplicated recipe table in `App.jsx` versus `data.js`.
- Unresolved issues:
  - Audio not yet verified on a physical iOS or Android device.
  - `public/sounds/` is now 3.0 MB; mobile-network load has not been measured.
  - Audio fidelity is placeholder-grade until replaced per `docs/audio-generation.md`.
- Next actions:
  1. Device check on iOS Safari and Android Chrome (audio unlock, PWA restart, one-handed reach).
  2. Decide on commissioning higher-fidelity BGM and voice.
  3. Resume the gameplay balance pass in `docs/current-status.md`.
\n
### 2026-08-31 (2) — Claude Code

- Objective: Improve and regenerate the character voice assets, after confirming whether VOICEVOX could be
  used instead of the in-house formant synthesiser.
- Feasibility check performed first:
  - `git ls-remote https://github.com/VOICEVOX/voicevox_core` succeeds — the session's git proxy serves
    public third-party repositories.
  - GitHub Release asset downloads return 403, and there is no `voicevox-core` package on PyPI. VOICEVOX
    ships its ONNX models and runtime binaries as Release assets, so it cannot be run in this environment.
  - Conclusion: the request was carried out as a quality pass on the existing synthesiser.
- Work completed:
  - Consonant-to-vowel formant transitions. Added `F2_LOCUS` per articulation place; the vowel's F1/F2 now
    glide out of the consonant's locus over ~45 ms instead of each mora being a static vowel.
  - Japanese vowel devoicing (`devoiced_flags`). /i/ and /u/ after a voiceless consonant are rendered as
    formant-shaped noise when phrase-final or before another voiceless consonant, so ます, ました, おつかれ
    and アップ devoice correctly. `/h/` is excluded as a trigger, which keeps こんにちは voiced.
  - Corrected the glottal source. The original slope left a 78.7 dB spectral tilt (natural speech is
    20-35 dB), which is why the first pass sounded dark and hollow. Now 20.8 dB.
  - Widened formant bandwidths and added F4, F5 and a broadband floor. With a child-register F0 above
    300 Hz the harmonics are far enough apart that narrow resonances dropped most of them into a valley.
  - Replaced the purely exponential mora envelope with attack/hold/release so long vowels sustain, and
    added pitch jitter, amplitude shimmer, and per-mora length and level variation.
  - Removed a dead `previous_vowel = previous_vowel` assignment in the moraic-nasal branch.
  - Fixed a latent bug in `scripts/generate_audio.py`: `--manifest` rebuilt the manifest without the
    `seconds` field, which the BGM loop points depend on, so running it would silently degrade looping.
    It now carries durations over from the existing manifest and warns when one is missing.
- Files and areas changed:
  - `scripts/audio/voice.py` (synthesiser rework)
  - `scripts/generate_audio.py` (`--manifest` fix)
  - `public/sounds/voice-*.mp3` (9 regenerated), `public/sounds/manifest.json`
  - `docs/audio-generation.md` (voice technique, devoicing table, verification method, free-tier caveats)
- Validation:
  - `npm run lint` clean; `npm test` 16/16 passing; `npm run build` succeeds; `git diff --check` clean.
  - Formant accuracy measured by LPC on the rendered signal at F0 = 110 Hz (LPC locks onto harmonics above
    300 Hz, so the game's own register cannot be measured this way): /a/ 1.2%/0.3%/0.3%, /i/ 3.4%/1.0%/3.4%,
    /u/ 0.6%/0.2%/0.6%, /e/ 2.3%/0.9%/0.7%, /o/ 5.2%/4.0%/0.7% error against target F1/F2/F3.
  - Devoiced morae confirmed aperiodic: autocorrelation peak 0.509 versus 0.993 for the voiced equivalent.
  - Regeneration left BGM and SE byte-identical, confirming the generator is deterministic and that this
    change is scoped to the voices.
  - Chromium run: all four voice cues reached in a play-through were fetched (200) and decoded, no errors.
- Decisions:
  - Keep the formant synthesiser rather than wait on an external TTS. It is the only option that runs in
    this environment, and the improvements above are audible without adding a licence obligation.
  - Devoicing is derived from a rule rather than hand-annotated per line, with `/h/` excluded, because the
    derived rule then gives the correct result for all nine lines and extends to new lines for free.
  - Verify formants at a lowered F0 rather than trusting a peak-picker at the game's own pitch. The first
    measurement attempt reported nonsense because it was finding F0 harmonics, not the formant envelope.
- Unresolved issues:
  - No device check yet on iOS or Android.
  - `public/sounds/` is 2.93 MB; mobile-network load has not been measured.
  - The voices remain non-lexical. Real speech needs an external TTS run outside this environment.
- Next actions:
  1. Device check on iOS Safari and Android Chrome (audio unlock, PWA restart, one-handed reach).
  2. Decide on commissioning higher-fidelity BGM and voice per `docs/audio-generation.md`.
  3. Resume the gameplay balance pass in `docs/current-status.md`.
\n
### 2026-08-31 (3) — Claude Code

- Objective: (A) record the hosting and repository-visibility analysis in the deployment policy, and
  (B) remove the hard-coded deployment path so a move to Cloudflare Pages costs nothing at build time.
- Context: the user asked whether developing a game intended for eventual monetisation in a public
  repository is the right call, given that GitHub Pages on the Free plan requires a public repository.
- A. Policy documentation (`docs/deployment-policy.md`):
  - Recorded that going public was a consequence of the GitHub Free limitation, not a goal, and that
    monetisation has never actually been decided anywhere in the repository.
  - Added the risk breakdown: the binding constraint is asset licensing, not source disclosure. Most AI
    audio services forbid redistributing the raw asset, and a public repository hands the audio files over
    via `git clone`. Since all audio is now self-generated, there is currently no exposure.
  - Added a hosting comparison and named Cloudflare Pages as the first choice: private repositories on the
    free tier, no commercial restriction, and per-branch preview URLs.
  - Defined the trigger for going private: adopting paid AI audio, or selling on itch.io.
- B. Host-independent build:
  - `vite.config.js` derives the base from `CF_PAGES` / `NETLIFY` with a `BASE_PATH` override.
  - `public/manifest.json` uses manifest-relative URLs.
  - `public/sw.js` derives its base from `self.location`.
  - Added `npm run build:root` via `scripts/build-root.mjs` (a Node script, so it works from cmd.exe).
  - Added Node and service-worker global scopes to `eslint.config.js`.
- Defect found and fixed while verifying B — offline relaunch rendered a blank page:
  1. The hashed JS/CSS bundles were never precached. They are requested before the worker takes control on
     a first visit, so they never reach its fetch handler; offline only worked from the second visit.
     Added a `precacheManifest` Vite plugin that writes the emitted filenames into `dist/sw.js`.
  2. Even once precached, the assets still missed. Hosts answer static files with `Vary: Origin`, and Vite
     emits its module script with `crossorigin`, so the page requests the bundle with an Origin header while
     the precache fetched it without one, and `caches.match` honoured Vary. Fixed with `ignoreVary: true`.
  This defect predates this branch; `deployment-policy.md` had "オフライン再起動を確認" still unchecked.
- Files and areas changed:
  - `vite.config.js`, `eslint.config.js`, `package.json`, `scripts/build-root.mjs`
  - `public/manifest.json`, `public/sw.js`
  - `docs/deployment-policy.md`, `README.md`
- Validation:
  - `npm run lint` clean; `npm test` 16/16 passing; `git diff --check` clean.
  - `npm run build`, `npm run build:root` and `CF_PAGES=1 vite build` all emit correct paths, and the
    precache placeholder is replaced in every case.
  - Chromium, both `/caking-game/` and `/`: game renders, service worker registers with the right scope,
    precache contents correct, all audio 200, no console or page errors.
  - Offline relaunch after a single visit now boots the full shell (brand, 5-item nav, status chips) under
    both bases. Before the fix it rendered an empty `#root`.
- Decisions:
  - Do not go private yet. With all audio self-generated there is no licensing exposure today, so the move
    is deferred until monetisation is actually decided.
  - Auto-detect the host rather than require build configuration, so Cloudflare Pages works unconfigured.
  - Precache only the app shell (HTML, JS, CSS, icons, manifest). Images and audio total roughly 27 MB and
    stay runtime-cached; precaching them would make installation unacceptable.
- Unresolved issues:
  - Offline coverage is shell-only on a first visit. Character images and audio are cached as they are
    visited, so a first-visit offline launch renders the UI without artwork or sound.
  - No physical-device check yet.
- Next actions:
  1. Decide on monetisation, then settle LICENSE, repository visibility, asset policy and distribution.
  2. If moving: connect Cloudflare Pages, verify preview URLs, then flip the repository to private.
  3. Device check on Android and iOS.
\n
### 2026-08-31 (4) — Claude Code

- Objective: Prepare the audio replacement trial, settle the four decisions that were blocking, and get the
  Cloudflare Pages move ready to execute.
- Work completed:
  - `scripts/import_audio.py`: places an externally produced file into `public/sounds/` and updates
    `manifest.json`. MP3 duration is measured by walking the MPEG frame headers (VBR-safe); WAV is encoded
    to MP3 at the project bitrate. `--bpm` / `--bars` compute an exact musical loop length, and the previous
    file is kept as `.bak`.
  - `docs/audio-generation.md`: a "try one track first" procedure (replace `shop-bgm` only, compare, roll
    back from `.bak`), the importer's usage, acceptance criteria, and Suno-ready prompts assuming
    Custom Mode with Instrumental on, plus an exclude-styles line.
  - `LICENSE` (MIT, verbatim so GitHub detects it) and `LICENSE-ASSETS.md` (assets, characters, scenario and
    title rights-reserved, with an explicit permitted/not-permitted list and fork guidance).
  - `public/_headers` and `public/_redirects` for Cloudflare Pages. GitHub Pages ignores both.
  - `docs/cloudflare-pages-setup.md`: the migration runbook, ordered so the Cloudflare deployment is
    verified before the repository is flipped to private.
  - `docs/deployment-policy.md`: recorded the four decisions and the reasoning behind two of them.
- Decisions taken by the user this session:
  - Distribution: free, with itch.io listed as pay-what-you-want at a zero minimum.
  - Licence: MIT for source, all rights reserved for assets.
  - Repository: stay public for now; the migration trigger is unchanged.
  - Audio: keep the generated audio until a listening test shows a replacement is worth it.
- Findings worth keeping:
  - `lameenc` writes no Xing/LAME header, so neither a browser nor the importer can recover the authored
    length from a generated file. This is why the manifest carries `seconds` and the player pins `loopEnd`
    to it. Measured encoder padding across the 29 files was 26-51 ms.
  - The importer subtracts encoder delay and padding when a LAME header is present, and warns when it is
    not — for BGM it asks for `--bpm`/`--bars` instead of trusting the measurement.
- Files and areas changed:
  - `scripts/import_audio.py`, `docs/audio-generation.md`
  - `LICENSE`, `LICENSE-ASSETS.md`, `README.md`
  - `public/_headers`, `public/_redirects`
  - `docs/cloudflare-pages-setup.md`, `docs/deployment-policy.md`
- Validation:
  - `npm run lint` clean; `npm test` 16/16 passing; `npm run build` succeeds; `git diff --check` clean.
  - Importer verified against all 29 existing files. `--bpm 112 --bars 16` reproduces `shop-bgm`'s
    34.286 s exactly. The WAV path, the `.bak` backup, the manifest update and the rollback were all
    exercised end to end and then reverted.
  - `_headers` and `_redirects` confirmed present in `dist/` after a build.
- Unresolved issues:
  - The copyright holder is the GitHub handle, not a real name or brand.
  - No physical-device check yet.
  - Whether paid audio is adopted is still open, pending the user's own listening test.
- Next actions:
  1. Generate a `shop-bgm` candidate and run the A/B.
  2. Device check on Android and iOS.
  3. If paid audio is adopted, follow the Cloudflare runbook.
