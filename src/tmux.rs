//! tmux integration installer.

use anyhow::{Context, Result};
use std::fs;
use std::io::Write;
use std::path::PathBuf;

const FRAGMENT: &str = r##"# peek.tmux — added by `peek install-tmux`. Edit freely.

# Hotkey: prefix + Ctrl-k → open peek search overlay.
bind-key C-k display-popup -E -w 80% -h 80% "peek query"

# Pipe every new pane through the peek shim. The shim ships in the peek repo
# at scripts/peek-pipe.sh — install it on PATH or update this line.
set-hook -g pane-focus-in 'pipe-pane -o "exec peek pipe-helper --pane #{pane_id} --session #{session_name}"'
"##;

pub fn install() -> Result<()> {
    let cfg_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("peek");
    fs::create_dir_all(&cfg_dir).with_context(|| format!("mkdir {}", cfg_dir.display()))?;
    let frag_path = cfg_dir.join("peek.tmux");
    fs::write(&frag_path, FRAGMENT).with_context(|| format!("write {}", frag_path.display()))?;

    let home = dirs::home_dir().context("no home dir")?;
    let tmux_conf = home.join(".tmux.conf");
    let source_line = format!("source-file {}", frag_path.display());
    let already = if tmux_conf.exists() {
        let body = fs::read_to_string(&tmux_conf)?;
        body.contains(&source_line)
    } else {
        false
    };

    if !already {
        let mut f = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&tmux_conf)?;
        writeln!(f, "\n# peek")?;
        writeln!(f, "{source_line}")?;
        println!("appended source-file line to {}", tmux_conf.display());
    } else {
        println!(
            "{} already sourced from {}",
            frag_path.display(),
            tmux_conf.display()
        );
    }
    println!("wrote {}", frag_path.display());
    println!("reload tmux: `tmux source-file ~/.tmux.conf`  (or restart tmux)");
    Ok(())
}
