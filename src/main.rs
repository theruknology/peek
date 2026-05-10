//! peek — Cmd-K for your tmux scrollback.
//!
//! Local semantic search across tmux pane scrollback. Single binary,
//! no cloud, sub-second answers.

use anyhow::Result;
use clap::{Parser, Subcommand};

mod ansi;
mod chunker;
mod daemon;
mod embed;
mod redact;
mod store;
mod tmux;
mod tui;

/// peek — semantic search for your tmux scrollback.
#[derive(Parser, Debug)]
#[command(name = "peek", version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    cmd: Option<Cmd>,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Run the background indexer that listens for tmux pipe-pane traffic.
    Daemon {
        /// Stay attached to the foreground (don't background).
        #[arg(long)]
        foreground: bool,
    },
    /// Open the TUI search overlay (default if no subcommand).
    Query {
        /// Optional initial query.
        #[arg(short, long)]
        q: Option<String>,
    },
    /// Print indexing stats (pane count, lines indexed, disk usage).
    Stats,
    /// Wipe the indexed scrollback database.
    Nuke {
        /// Skip the confirmation prompt.
        #[arg(long)]
        yes: bool,
    },
    /// Install the tmux integration (hotkey + pipe-pane).
    InstallTmux,
    /// Send a captured chunk to the daemon (used by the tmux pipe-pane shim).
    PipeHelper {
        /// The tmux pane id, e.g. %3.
        #[arg(long)]
        pane: String,
        /// The tmux session name.
        #[arg(long, default_value = "default")]
        session: String,
    },
    /// Read stdin and print it through the redactor (debug helper).
    RedactTest,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd.unwrap_or(Cmd::Query { q: None }) {
        Cmd::Daemon { foreground } => daemon::run(foreground),
        Cmd::Query { q } => tui::run(q),
        Cmd::Stats => cmd_stats(),
        Cmd::Nuke { yes } => cmd_nuke(yes),
        Cmd::InstallTmux => tmux::install(),
        Cmd::PipeHelper { pane, session } => daemon::pipe_helper(&pane, &session),
        Cmd::RedactTest => cmd_redact_test(),
    }
}

fn cmd_stats() -> Result<()> {
    let s = store::Store::open()?;
    let st = s.stats()?;
    println!("peek stats");
    println!("  database : {}", store::Store::db_path()?.display());
    println!("  chunks   : {}", st.chunks);
    println!("  panes    : {}", st.panes);
    println!("  bytes    : {}", st.bytes);
    Ok(())
}

fn cmd_nuke(yes: bool) -> Result<()> {
    if !yes {
        eprintln!("This will delete all indexed scrollback. Re-run with --yes to confirm.");
        return Ok(());
    }
    let path = store::Store::db_path()?;
    if path.exists() {
        std::fs::remove_file(&path)?;
        println!("removed {}", path.display());
    } else {
        println!("nothing to remove ({} does not exist)", path.display());
    }
    Ok(())
}

fn cmd_redact_test() -> Result<()> {
    use std::io::Read;
    let mut s = String::new();
    std::io::stdin().read_to_string(&mut s)?;
    let stripped = ansi::strip(&s);
    let redacted = redact::redact(&stripped);
    print!("{redacted}");
    Ok(())
}
