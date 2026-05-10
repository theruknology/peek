//! Ratatui-based search overlay.

use anyhow::Result;
use crossterm::event::{self, Event, KeyCode, KeyEventKind, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, ListState, Paragraph};
use ratatui::Terminal;
use std::io;
use std::time::{Duration, Instant};

use crate::embed::Embedder;
use crate::store::{Hit, Store};

pub fn run(initial: Option<String>) -> Result<()> {
    let store = Store::open()?;
    let embedder = Embedder::new()?;

    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = ratatui::backend::CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let res = run_inner(&mut terminal, &store, &embedder, initial);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;
    res
}

#[derive(Default)]
struct AppState {
    query: String,
    hits: Vec<Hit>,
    list: ListState,
    last_input: Option<Instant>,
    last_searched: String,
    status: String,
    quit: bool,
    output: Option<String>,
}

fn run_inner<B: ratatui::backend::Backend>(
    terminal: &mut Terminal<B>,
    store: &Store,
    embedder: &Embedder,
    initial: Option<String>,
) -> Result<()> {
    let stats = store.stats()?;
    let mut app = AppState::default();
    if let Some(q) = initial {
        app.query = q;
        app.last_input = Some(Instant::now() - Duration::from_millis(200));
    }

    loop {
        // Debounced search: 100ms idle since last keystroke, query changed.
        if let Some(t) = app.last_input {
            if t.elapsed() >= Duration::from_millis(100) && app.query != app.last_searched {
                if app.query.trim().is_empty() {
                    app.hits.clear();
                } else {
                    let v = embedder.embed(&app.query)?;
                    app.hits = store.query(&v, 20)?;
                    if !app.hits.is_empty() {
                        app.list.select(Some(0));
                    }
                }
                app.last_searched = app.query.clone();
                app.last_input = None;
            }
        }

        terminal.draw(|f| draw(f, &mut app, &stats))?;

        if event::poll(Duration::from_millis(50))? {
            if let Event::Key(k) = event::read()? {
                if k.kind != KeyEventKind::Press {
                    continue;
                }
                match (k.code, k.modifiers) {
                    (KeyCode::Esc, _) | (KeyCode::Char('q'), KeyModifiers::NONE)
                        if app.query.is_empty() =>
                    {
                        app.quit = true;
                    }
                    (KeyCode::Char('c'), KeyModifiers::CONTROL) => app.quit = true,
                    (KeyCode::Char(c), m) if !m.contains(KeyModifiers::CONTROL) => {
                        app.query.push(c);
                        app.last_input = Some(Instant::now());
                    }
                    (KeyCode::Backspace, _) => {
                        app.query.pop();
                        app.last_input = Some(Instant::now());
                    }
                    (KeyCode::Down, _) => {
                        let i = app.list.selected().map(|i| i + 1).unwrap_or(0);
                        if i < app.hits.len() {
                            app.list.select(Some(i));
                        }
                    }
                    (KeyCode::Up, _) => {
                        let i = app.list.selected().unwrap_or(0).saturating_sub(1);
                        app.list.select(Some(i));
                    }
                    (KeyCode::Enter, _) => {
                        if let Some(i) = app.list.selected() {
                            if let Some(h) = app.hits.get(i) {
                                app.output =
                                    Some(format!("tmux switch-client -t {}", h.chunk.pane_id));
                                app.quit = true;
                            }
                        }
                    }
                    (KeyCode::F(3), _) => {
                        // 'c' alternate: copy via arboard.
                        copy_selected(&app);
                        app.status = "copied".into();
                    }
                    _ => {}
                }
                // 'c' on its own (when query non-empty would type the char)
                // → use Ctrl+Y instead.
                if matches!(k.code, KeyCode::Char('y'))
                    && k.modifiers.contains(KeyModifiers::CONTROL)
                {
                    copy_selected(&app);
                    app.status = "copied".into();
                }
            }
        }

        if app.quit {
            break;
        }
    }

    if let Some(o) = app.output {
        println!("{o}");
    }
    Ok(())
}

fn copy_selected(app: &AppState) {
    if let Some(i) = app.list.selected() {
        if let Some(h) = app.hits.get(i) {
            if let Ok(mut cb) = arboard::Clipboard::new() {
                let _ = cb.set_text(h.chunk.content.clone());
            }
        }
    }
}

fn draw(f: &mut ratatui::Frame, app: &mut AppState, stats: &crate::store::Stats) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(3),
            Constraint::Length(1),
        ])
        .split(f.size());

    let header = format!("peek  ·  {} chunks  ·  {} panes", stats.chunks, stats.panes);
    let q = Paragraph::new(Line::from(vec![
        Span::styled("> ", Style::default().fg(Color::Cyan)),
        Span::raw(&app.query),
    ]))
    .block(
        Block::default()
            .borders(Borders::ALL)
            .title(format!(" {header} ")),
    );
    f.render_widget(q, chunks[0]);

    if app.hits.is_empty() {
        let msg = if stats.chunks == 0 {
            "No scrollback indexed yet.\n\nRun `peek install-tmux`, then `peek daemon` in the background.\nNew tmux pane output will be captured automatically."
        } else if app.query.is_empty() {
            "Type to search your tmux scrollback."
        } else {
            "No results."
        };
        let p =
            Paragraph::new(msg).block(Block::default().borders(Borders::ALL).title(" results "));
        f.render_widget(p, chunks[1]);
    } else {
        let items: Vec<ListItem> = app
            .hits
            .iter()
            .map(|h| {
                let snippet: String = h
                    .chunk
                    .content
                    .lines()
                    .next()
                    .unwrap_or("")
                    .chars()
                    .take(96)
                    .collect();
                let line = Line::from(vec![
                    Span::styled(
                        format!("{:>5.2}  ", h.score),
                        Style::default().fg(Color::Yellow),
                    ),
                    Span::styled(
                        format!("{:<10} ", h.chunk.session),
                        Style::default().fg(Color::Magenta),
                    ),
                    Span::styled(
                        format!("{:<8} ", h.chunk.pane_id),
                        Style::default().fg(Color::Green),
                    ),
                    Span::raw(snippet),
                ]);
                ListItem::new(line)
            })
            .collect();
        let list = List::new(items)
            .block(Block::default().borders(Borders::ALL).title(" results "))
            .highlight_style(Style::default().add_modifier(Modifier::REVERSED));
        f.render_stateful_widget(list, chunks[1], &mut app.list);
    }

    let footer_text = if app.status.is_empty() {
        "↵ jump   Ctrl+Y copy   ↑/↓ select   Esc quit".to_string()
    } else {
        app.status.clone()
    };
    let footer = Paragraph::new(footer_text).style(Style::default().fg(Color::DarkGray));
    f.render_widget(footer, chunks[2]);
}
