//! Per-pane line buffer and 20-line / 5-overlap window chunker.

const WINDOW: usize = 20;
const OVERLAP: usize = 5;

/// Accumulates lines for a single pane and emits ~20-line windows
/// with 5-line overlap.
#[derive(Default)]
pub struct PaneBuffer {
    lines: Vec<String>,
    /// Total lines ever pushed (used as a rough offset/seq number).
    pub seq: u64,
}

impl PaneBuffer {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Push one line. Returns Some(window) when a chunk is ready.
    pub fn push(&mut self, line: String) -> Option<String> {
        self.seq += 1;
        self.lines.push(line);
        if self.lines.len() >= WINDOW {
            let chunk = self.lines.join("\n");
            // Retain overlap for the next window.
            let keep = OVERLAP.min(self.lines.len());
            let tail = self.lines.split_off(self.lines.len() - keep);
            self.lines = tail;
            Some(chunk)
        } else {
            None
        }
    }

    /// Force-emit any buffered lines (e.g. on shutdown).
    #[allow(dead_code)]
    pub fn flush(&mut self) -> Option<String> {
        if self.lines.is_empty() {
            None
        } else {
            let out = self.lines.join("\n");
            self.lines.clear();
            Some(out)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emits_at_window() {
        let mut b = PaneBuffer::new();
        for i in 0..19 {
            assert!(b.push(format!("l{i}")).is_none());
        }
        let out = b.push("l19".into()).unwrap();
        assert_eq!(out.lines().count(), 20);
    }

    #[test]
    fn keeps_overlap() {
        let mut b = PaneBuffer::new();
        for i in 0..20 {
            b.push(format!("l{i}"));
        }
        // After emit, 5 lines retained.
        for i in 20..35 {
            // 15 more lines → 5 + 15 = 20 → emit again
            let _ = b.push(format!("l{i}"));
        }
        // The next push (line 35) should not yet trigger emit; we retained 5
        // and pushed 15 more, then emitted, leaving 5. So push #34 emitted.
        // Just sanity: flush returns the remaining 5.
        let tail = b.flush().unwrap();
        assert_eq!(tail.lines().count(), 5);
    }

    #[test]
    fn flush_empty() {
        let mut b = PaneBuffer::new();
        assert!(b.flush().is_none());
    }
}
