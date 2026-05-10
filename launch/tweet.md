# Launch tweet thread

## Tweet 1 (the hook + GIF)

I keep losing things in tmux scrollback.

So I built Cmd-K for it.

Local embed model. 200ms. Zero cloud.

[GIF: hit hotkey → type "that jwt error" → jump to it]

github.com/YOUR_USER/peek

## Tweet 2 (the how)

Every line that scrolls past in tmux gets:
• ANSI-stripped
• secrets-redacted (AWS/JWT/`*_TOKEN=`)
• chunked (20-line window)
• embedded with BGE-small on CPU
• tossed into sqlite + sqlite-vec

Query is top-K cosine. Single 12MB Rust binary.

## Tweet 3 (the privacy line)

100% local. No telemetry. No API key. No cloud.

If you can't run it on a plane, I don't ship it.

## Tweet 4 (the install)

```
brew install YOUR_USER/peek/peek
peek install-tmux
peek daemon &
```

Hit prefix+Ctrl-k from any pane. Type a question. Jump.

## Tweet 5 (the ask)

It's MIT. PRs welcome — especially kitty / wezterm / ghostty integrations.

If `peek` saves you from one more Ctrl-R regret, a ★ helps others find it 🌟

github.com/YOUR_USER/peek
