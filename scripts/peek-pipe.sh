#!/usr/bin/env bash
# peek-pipe.sh — invoked by `tmux pipe-pane` to forward pane output to peek.
#
# tmux invokes this with the pane content streaming on stdin. We pass the
# pane id and session name through.
set -euo pipefail
PANE="${1:-${TMUX_PANE:-unknown}}"
SESSION="${2:-default}"
exec peek pipe-helper --pane "$PANE" --session "$SESSION"
