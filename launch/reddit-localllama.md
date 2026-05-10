# r/LocalLLaMA post

**Title:** Built a local-only semantic search for terminal scrollback — BGE-small + sqlite-vec, 200ms queries

**Flair:** Other

**Body:**

Sharing in case useful — `peek` indexes your tmux scrollback with BGE-small (fastembed-rs, ONNX, CPU) and gives you semantic search over everything you've seen. 100% local. No API key. No cloud.

The local-LLM angle that might interest this sub:

- **Embedding**: BGE-small-en-v1.5, ONNX-quantized via fastembed-rs. ~30MB. ~5-15ms per chunk on CPU. Faster than calling Ollama embeddings (no http overhead).
- **Storage**: sqlite + sqlite-vec extension. Brute-force cosine fine to ~1M chunks (~150ms p99). HNSW (usearch / hnsw-rs) on roadmap for past that.
- **Optional ask-follow-up**: hit `?` on a result, peek pipes the snippet + your question to Ollama (configurable model, qwen2.5:3b default), streams the answer in the overlay. Off by default.
- **Redaction**: regex pass before embed/store catches AWS/Anthropic/OpenAI keys + JWT + `*_TOKEN=` patterns. Configurable via toml.

Single 12MB Rust binary. macOS + Linux. Tmux-only for now; shell-hook integrations for kitty/wezterm/ghostty are next.

github.com/YOUR_USER/peek — MIT, PRs welcome.

Curious if anyone has used sqlite-vec at scale — would love to hear about pain points before I go past 1M chunks.
