# Show HN launch

## Title (≤80 chars)

Show HN: Peek – Spotlight for your terminal scrollback (local, 200ms, no cloud)

## URL

https://github.com/YOUR_USER/peek

## Body

Hi HN,

I kept losing things in tmux scrollback. The stack trace from this morning, the one log line that explained the bug, the output of a script I ran two hours ago — all in there somewhere behind 40k lines of `make` and `npm install` noise.

`peek` is what I built. It pipes every tmux pane through a local capture daemon, embeds the output with BGE-small (ONNX, on CPU), and stores chunks in sqlite + sqlite-vec. From any pane you hit `prefix + Ctrl-k`, an overlay pops up, you type a question in plain English, and the top results show up in <200ms with timestamp + pane + snippet. Hit enter and tmux jumps to that pane scrolled to that line.

Everything is local. No telemetry. No API key. Single 12MB Rust binary plus a 30MB embed model that downloads once. API keys / JWTs / `*_TOKEN=...`-style env vars are redacted before they hit the index.

Demo gif in the README. The MVP is tmux-only; kitty/wezterm/ghostty integrations are next, and I'd love help on those.

Honest limitations:
- ~200MB RSS for the daemon at steady state on a busy box
- Brute-force vector search until ~10M chunks; HNSW index after that
- macOS + Linux only for now (Windows via WSL works)
- Cold start downloads the embed model on first run (one-time)

Why I posted this: there's `atuin` for shell history (commands), `script(1)` for session logs (no search), and `tmux capture-pane | grep` for one buffer at a time. Nothing lets you ask "that jwt error from yesterday" and jump to the line. I figured someone else might want it too.

PRs and bug reports very welcome. License is MIT.

## Comments preparation

Common questions to be ready for:

**"Why not use atuin's history search?"**
> atuin indexes commands. peek indexes their *output*. Different problem. They compose: I use both.

**"Privacy concerns about indexing everything?"**
> Default redaction covers AWS / Anthropic / OpenAI / JWT / `*_TOKEN=...` patterns. The DB is a local sqlite file. `peek nuke` wipes it. `peek redact-test` lets you preview what gets stripped. Open to suggestions for default patterns.

**"BGE-small is fine but won't scale to long-context queries"**
> Right — for short noun-phrase queries it's great. For long natural-language queries I want to swap to a re-ranker (BGE-reranker-base, also ONNX). Tracked in the roadmap.

**"sqlite-vec at 1M+ vectors?"**
> Brute force is fine to ~1M; I've benchmarked at ~150ms p99. Past that, an HNSW backend (usearch or hnsw-rs) is on the roadmap.

**"Why Rust?"**
> Single binary, no runtime, fastembed-rs is great, ratatui is great, and I wanted sub-200ms p99 without thinking about it.
