//! ANSI escape stripping. Uses the `vte` parser so we correctly handle
//! CSI/OSC sequences (and not just `\x1b[...m`).

use vte::{Params, Parser, Perform};

#[derive(Default)]
struct Stripper {
    out: String,
}

impl Perform for Stripper {
    fn print(&mut self, c: char) {
        self.out.push(c);
    }
    fn execute(&mut self, byte: u8) {
        // Keep newline, tab, carriage return; drop bells & friends.
        match byte {
            b'\n' | b'\t' => self.out.push(byte as char),
            b'\r' => self.out.push('\n'),
            _ => {}
        }
    }
    fn hook(&mut self, _: &Params, _: &[u8], _: bool, _: char) {}
    fn put(&mut self, _: u8) {}
    fn unhook(&mut self) {}
    fn osc_dispatch(&mut self, _: &[&[u8]], _: bool) {}
    fn csi_dispatch(&mut self, _: &Params, _: &[u8], _: bool, _: char) {}
    fn esc_dispatch(&mut self, _: &[u8], _: bool, _: u8) {}
}

/// Strip ANSI escape sequences and most control bytes from `s`,
/// returning printable text with newlines preserved.
pub fn strip(s: &str) -> String {
    let mut parser = Parser::new();
    let mut sink = Stripper::default();
    for b in s.as_bytes() {
        parser.advance(&mut sink, *b);
    }
    sink.out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_csi_color() {
        let s = "\x1b[31mhello\x1b[0m world";
        assert_eq!(strip(s), "hello world");
    }

    #[test]
    fn keeps_newlines() {
        let s = "a\nb\n\x1b[1mc\x1b[0m";
        assert_eq!(strip(s), "a\nb\nc");
    }

    #[test]
    fn strips_osc() {
        let s = "\x1b]0;title\x07after";
        assert_eq!(strip(s), "after");
    }

    #[test]
    fn plain_passthrough() {
        assert_eq!(strip("just text"), "just text");
    }
}
