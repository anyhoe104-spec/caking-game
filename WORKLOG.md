# Project worklog

This file is the shared source of truth for cross-device and cross-agent handoffs. Keep the current handoff concise and preserve dated reports as an append-only history.

## Current handoff

- Updated: 2026-08-31 21:44 +0900 (Asia/Tokyo)
- Agent: Claude Code
- Branch: `claude/caking-weekly-improvements-bg3gnf`
- Objective: Weekly improvement pass — UI overhaul, scene BGM, SE and character voice, animation — followed by
  a quality pass on the synthesised character voices.
- Completed:
  - Rebuilt the in-game UI: the service screen carries `オーダー / 目標 / ステータス` sub-tabs with a heads-up
    display, orders link straight to their recipe, and a settings modal replaces the two header toggles.
  - Added the audio layer: 5 scene BGM loops with crossfades, 15 sound effects, 9 character voice cues, and
    per-channel volume and mute settings persisted in the save.
  - Added the motion layer covering screen transitions, bake results, order service, level up and recipe
    unlock, with a reduced-motion switch and `prefers-reduced-motion` support.
  - Reworked the voice synthesiser: consonant-to-vowel formant transitions, Japanese vowel devoicing,
    a corrected glottal source slope, wider formant bandwidths with F4/F5, and per-mora micro-variation.
  - Every audio asset is generated from code, so the project owns all 29 files outright: no licence, no
    credit line, no cost.
- In progress:
  - Nothing outstanding on this branch.
- Blockers and risks:
  - Audio has only been verified in headless Chromium. iOS Safari gesture unlocking and PWA-restart BGM
    resumption still need a device check.
  - `public/sounds/` is 2.93 MB. BGM is fetched lazily per scene, but this has not been measured on a real
    mobile connection.
  - Voice fidelity is bounded by the technique: these are formant-synthesised pseudo-voices, not speech.
    VOICEVOX cannot run inside this environment — its models ship as GitHub Release assets, which the
    network policy blocks — so any real voice acting has to be generated outside the agent session.
- Next actions:
  1. Play through on iPhone Safari and Android Chrome: confirm audio unlocks on first tap, BGM resumes after
     a PWA restart, and the settings modal is reachable one-handed.
  2. Decide whether to commission higher-fidelity BGM and voice; if so, follow `docs/audio-generation.md`.
     Note that free tiers of AI music services grant no commercial rights retroactively.
  3. Continue the balance pass listed in `docs/current-status.md`.
- Validation: `npm run lint` clean; `npm test` 16/16 passing; `npm run build` succeeds; `git diff --check`
  clean. Browser runs in Chromium (390x844) covered the opening, service, all five tabs, the daily report,
  the ending, a v3-to-v4 save migration, muting and reduced motion, with no console or page errors.
  Voice formants measured within 0.2-5.2% of target by LPC analysis; spectral tilt 20.8 dB.

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
