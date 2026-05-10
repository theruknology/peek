//! Background indexer.
//!
//! Listens on a unix socket. Each line written to the socket is a JSON
//! object: `{"pane_id": "...", "session": "...", "ts": <unix>, "content": "..."}`.
//! Lines are stripped, redacted, buffered per-pane, chunked, embedded,
//! and stored.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;

use crate::ansi;
use crate::chunker::PaneBuffer;
use crate::embed::Embedder;
use crate::redact;
use crate::store::Store;

#[derive(Serialize, Deserialize, Debug)]
pub struct CaptureMsg {
    pub pane_id: String,
    pub session: String,
    pub ts: i64,
    pub content: String,
}

pub fn socket_path() -> PathBuf {
    if let Ok(rt) = std::env::var("XDG_RUNTIME_DIR") {
        return PathBuf::from(rt).join("peek.sock");
    }
    let uid = nix::unistd::Uid::current().as_raw();
    PathBuf::from(format!("/tmp/peek-{uid}.sock"))
}

pub fn run(_foreground: bool) -> Result<()> {
    let sock = socket_path();
    if sock.exists() {
        let _ = std::fs::remove_file(&sock);
    }
    if let Some(parent) = sock.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    let listener = UnixListener::bind(&sock).with_context(|| format!("bind {}", sock.display()))?;
    eprintln!("peek daemon listening on {}", sock.display());

    let store = Arc::new(Mutex::new(Store::open()?));
    let embedder = Arc::new(Embedder::new()?);
    let buffers: Arc<Mutex<HashMap<String, PaneBuffer>>> = Arc::new(Mutex::new(HashMap::new()));

    for stream in listener.incoming() {
        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                eprintln!("accept error: {e}");
                continue;
            }
        };
        let store = store.clone();
        let embedder = embedder.clone();
        let buffers = buffers.clone();
        thread::spawn(move || {
            if let Err(e) = handle(stream, store, embedder, buffers) {
                eprintln!("conn error: {e}");
            }
        });
    }
    Ok(())
}

fn handle(
    stream: UnixStream,
    store: Arc<Mutex<Store>>,
    embedder: Arc<Embedder>,
    buffers: Arc<Mutex<HashMap<String, PaneBuffer>>>,
) -> Result<()> {
    let reader = BufReader::new(stream);
    for line in reader.lines() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }
        let msg: CaptureMsg = match serde_json::from_str(&line) {
            Ok(m) => m,
            Err(e) => {
                eprintln!("bad msg: {e}");
                continue;
            }
        };
        let cleaned = redact::redact(&ansi::strip(&msg.content));
        let mut chunks_to_index = Vec::new();
        {
            let mut bufs = buffers.lock().unwrap();
            let buf = bufs.entry(msg.pane_id.clone()).or_default();
            for ln in cleaned.lines() {
                if let Some(chunk) = buf.push(ln.to_string()) {
                    chunks_to_index.push(chunk);
                }
            }
        }
        for chunk in chunks_to_index {
            let v = embedder.embed(&chunk)?;
            let s = store.lock().unwrap();
            s.insert_chunk(&msg.pane_id, &msg.session, msg.ts, &chunk, &v)?;
        }
    }
    Ok(())
}

/// `peek pipe-helper`: read stdin and forward each line to the daemon.
/// Wired via `tmux pipe-pane` in the install fragment.
pub fn pipe_helper(pane: &str, session: &str) -> Result<()> {
    let sock = socket_path();
    let mut stream =
        UnixStream::connect(&sock).with_context(|| format!("connect {}", sock.display()))?;
    let stdin = std::io::stdin();
    let mut buf = String::new();
    let mut reader = stdin.lock();
    loop {
        buf.clear();
        let n = reader.read_line(&mut buf)?;
        if n == 0 {
            break;
        }
        let msg = CaptureMsg {
            pane_id: pane.to_string(),
            session: session.to_string(),
            ts: chrono::Utc::now().timestamp(),
            content: buf.clone(),
        };
        let line = serde_json::to_string(&msg)?;
        stream.write_all(line.as_bytes())?;
        stream.write_all(b"\n")?;
    }
    Ok(())
}
