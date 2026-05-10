# r/commandline post

**Title:** I built a Cmd-K for tmux scrollback — semantic search over everything you've seen, 100% local

**Flair:** Project / Tool

**Body:**

Hi r/commandline,

Frustration: I'd see an error in pane:api, switch over to pane:web, do an hour of work, and then need to find that error again. `Ctrl-R` doesn't help (commands, not output). `tmux capture-pane | grep` is one pane and exact-match. `script(1)` saves a log but no search UX.

So I built **peek**: a daemon that pipes every tmux pane through a local embedding model (BGE-small via fastembed-rs), stores chunks in sqlite + sqlite-vec, and gives you a ratatui overlay you can pop with `prefix + Ctrl-k`. Type a question in plain English, sub-200ms top-K results with timestamp + pane + snippet, hit enter to jump.

Everything local. Single 12MB Rust binary. ~30MB model downloaded once. API keys / JWTs / `*_TOKEN=` env vars redacted before indexing.

```
peek                    open the overlay
peek daemon             start the indexer
peek install-tmux       add the hotkey
peek nuke               wipe everything
```

GIF + install in the README: github.com/theruknology/peek

MIT. Honest limitations + roadmap in the README. PRs especially welcome for kitty / wezterm / ghostty integrations — those are next.
