<div align="center">

# peek

### Spotlight for your terminal scrollback.

**What was that error yesterday?** — answered in 200ms. 100% local.

[![CI](https://github.com/theruknology/peek/actions/workflows/ci.yml/badge.svg)](https://github.com/theruknology/peek/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/theruknology/peek?style=social)](https://github.com/theruknology/peek/stargazers)

<img src="docs/peek-demo.gif" width="720" alt="peek demo: type 'that jwt error', jump to it">

</div>

---

You lose stuff in tmux scrollback every day.

That stack trace from this morning. The one log line that explained the bug. The output of the script you ran two hours ago. It's in there, somewhere, behind 40,000 lines of `make` output and `npm install` noise.

`peek` indexes everything that scrolls past in tmux, locally, and lets you ask for it in plain English.

```
$ peek
> that error about jwt signing yesterday

▸ yesterday 17:42  pane:api  PEM_read_bio: no start line     0.94
  yesterday 17:48  pane:api  RS256 vs HS256 mismatch          0.81
  today    09:11  pane:web  401 from /auth, related?          0.62

↵ jump to pane    ⌘c copy snippet    ? ask follow-up    q quit
```

Hit `↵` — tmux jumps to that pane, scrolled to that line. Done.

## Features

- **Semantic, not grep.** Type "that build error from yesterday", not `grep -r "ERROR" ~/.tmux-logs/`.
- **Sub-200ms queries** over 1M+ lines. Local BGE-small embeddings, sqlite-vec storage.
- **100% local.** Your scrollback never leaves the machine. No telemetry. No cloud. No API key.
- **One hotkey.** `prefix + Ctrl-k` from any pane. The overlay pops, you type, you jump.
- **Privacy-first.** API keys, JWTs, and `*_TOKEN=...`-style env vars are auto-redacted *before* indexing.
- **Tiny.** Single static binary, ~12MB. Embed model downloaded once, ~30MB.

## Install

No package yet — clone and build from source. Needs a Rust toolchain ([rustup](https://rustup.rs)).

```bash
git clone https://github.com/theruknology/peek
cd peek
cargo build --release
# binary lands at ./target/release/peek — symlink it onto your PATH:
ln -s "$PWD/target/release/peek" ~/.local/bin/peek
```

(Packaging — Homebrew tap, Cargo crate, prebuilt release binaries — comes once the surface stabilises. PRs welcome.)

## Quickstart (90 seconds)

```bash
# 1. Add the hotkey + tmux capture
peek install-tmux
tmux source-file ~/.tmux.conf

# 2. Start the indexer
peek daemon &

# 3. Use your terminal normally for a while.

# 4. From any tmux pane, hit:  prefix + Ctrl-k
#    Type a question. Hit enter. Jump.
```

That's it.

## Why peek and not...

| Tool | What it does | What `peek` adds |
|------|--------------|------------------|
| `atuin` | Cloud-synced shell **history** | History is *commands*. peek is *output*, semantic, multi-pane. |
| `mcfly` | Neural shell history | Same — commands only, exact-match-ish. |
| `tmux capture-pane` + `grep` | Greps a single pane buffer | One pane, exact match, no time travel, no cross-pane. |
| `script(1)` | Logs a session to a file | Storage only. No search UX, no indexing, no ranking. |
| VS Code "search in terminal" | Buffer search in editor | Single buffer, exact match, no semantic, no past sessions. |

`peek` is the gap: **semantic search over everything you've seen across every pane**.

## How it works

```
tmux pipe-pane ──► capture stream (per-pane)
                       │
                       ▼
                  ANSI strip + redact
                       │
                       ▼
                  chunker (20-line window, 5 overlap)
                       │
                       ▼
                  embedder (fastembed BGE-small ONNX, CPU)
                       │
                       ▼
                  sqlite + sqlite-vec
                       ▲
                       │
                  ratatui TUI ── top-K cosine
```

Every line tmux pipes to us is stripped of escape codes, scanned for secrets, chunked, embedded, and tossed into a vector index in `~/.local/share/peek/db.sqlite`. Queries do a top-K cosine search and render the matches with timestamp, pane, and snippet. No part of this leaves your laptop.

Cold start to first query: ~30s on first launch (model download), instant after.

## Privacy

- Captured scrollback lives in `~/.local/share/peek/db.sqlite`. Local file. Never sent anywhere.
- Default redaction patterns:
  - AWS keys (`AKIA[0-9A-Z]{16}`)
  - JWTs (`eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`)
  - Anthropic keys (`sk-ant-[A-Za-z0-9_-]+`)
  - OpenAI keys (`sk-[A-Za-z0-9]{32,}`)
  - Anything matching `[A-Z_]+(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*\S+`
- Add custom regex via `~/.config/peek/redact.toml`.
- Test what gets redacted: `peek redact-test < some-output.log`
- Wipe everything: `peek nuke`

## Optional: ask-follow-up

If you have [Ollama](https://ollama.com) running locally, hit `?` on a result to ask a follow-up question. peek pipes the snippet + your question to Ollama and streams the answer in the overlay. Off by default. No data leaves the machine.

```bash
# enable
echo 'ollama_model = "qwen2.5:3b"' >> ~/.config/peek/config.toml
```

## CLI

```
peek                    Open the search overlay (default)
peek daemon             Start the background indexer
peek install-tmux       Add hotkey + pipe-pane to your tmux config
peek stats              Show indexed lines, disk usage, panes watched
peek nuke               Wipe all indexed scrollback
peek redact-test        Pipe text in, see what gets redacted
```

## Roadmap

- [x] tmux integration
- [x] BGE-small local embeddings
- [x] sqlite-vec storage
- [x] ratatui overlay
- [x] redaction defaults
- [x] ask-follow-up via Ollama
- [ ] kitty / wezterm / ghostty integration (shell hook based)
- [ ] HNSW index for >10M chunks
- [ ] cross-machine sync (encrypted, opt-in, peer-to-peer)
- [ ] Windows native (PRs welcome)

## Contributing

PRs welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues are tagged.

## License

MIT. See [LICENSE](LICENSE).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=theruknology/peek&type=Date)](https://star-history.com/#theruknology/peek&Date)

---

<div align="center">

If `peek` saves you from one more `Ctrl-R` regret — leave a ★ so others find it.

</div>
