# Contributing to peek

Thanks for considering a contribution.

## Quick start

```bash
git clone https://github.com/theruknology/peek
cd peek
cargo build
cargo test
cargo run -- query
```

## Ground rules

- Keep the binary local-only. No analytics, no remote calls without an explicit opt-in flag.
- Keep the dep tree small. Every new crate is debt.
- Sub-200ms query latency on a 1M-chunk DB is the perf target. Benchmark before merging perf changes.
- TUI changes should be reviewable as a screenshot. Attach one in the PR.

## Good first issues

- Add a terminal integration (kitty, wezterm, ghostty, alacritty)
- Add a redaction pattern for `<service>` API keys
- Improve cold-start time (lazy model load, smaller embed model)
- Translate the README

## Filing a bug

Include:
- `peek --version`
- `peek stats` output
- OS + tmux version
- The query that misbehaved + what you expected

## Code style

- `cargo fmt` before committing (CI enforces).
- `cargo clippy -- -D warnings` must be clean.
- Public API needs doc comments. Internal helpers don't.
