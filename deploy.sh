#!/usr/bin/env bash
# Update https://web-games.ruybalid.com from GitHub.
#
# Run from Git Bash in this folder:   ./deploy.sh
#
# What it does:
#   1. Checks that your local web_games and bot-ship-game have no unpushed
#      commits (the server pulls from GitHub, not from your PC).
#   2. SSHes into Bluehost and runs `git pull` in the site folder.
#   3. Pulls (or clones, the first time) bot-ship-game into <site>/bot-ship-game.
#
# Settings live in deploy.config (copy deploy.config.example to start).
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f deploy.config ]]; then
    echo "Missing deploy.config. Copy deploy.config.example to deploy.config and fill it in." >&2
    exit 1
fi
# shellcheck source=deploy.config.example
source deploy.config

: "${SSH_TARGET:?Set SSH_TARGET in deploy.config}"
: "${SITE_DIR:?Set SITE_DIR in deploy.config}"
SSH_PORT="${SSH_PORT:-22}"
BOT_SHIP_REPO="${BOT_SHIP_REPO:-https://github.com/DonkeyCow74/bot-ship-game.git}"
BOT_SHIP_LOCAL="${BOT_SHIP_LOCAL:-../bot-ship-game}"

check_pushed() {
    local dir="$1"
    [[ -d "$dir/.git" ]] || return 0
    git -C "$dir" fetch --quiet origin || { echo "  (couldn't reach GitHub for $dir, skipping check)"; return 0; }
    local ahead dirty
    ahead=$(git -C "$dir" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
    dirty=$(git -C "$dir" status --porcelain | wc -l)
    if [[ "$ahead" -gt 0 ]]; then
        echo "WARNING: $dir has $ahead commit(s) not pushed to GitHub. Run 'git push' there first." >&2
        return 1
    fi
    if [[ "$dirty" -gt 0 ]]; then
        echo "Note: $dir has uncommitted changes. They will NOT be deployed."
    fi
}

echo "Checking local repos..."
ok=1
check_pushed . || ok=0
check_pushed "$BOT_SHIP_LOCAL" || ok=0
if [[ $ok -eq 0 && "${1:-}" != "--force" ]]; then
    echo "Stopping. Push first, or run ./deploy.sh --force to deploy what's on GitHub anyway." >&2
    exit 1
fi

echo "Deploying to $SSH_TARGET:$SITE_DIR ..."
ssh -p "$SSH_PORT" "$SSH_TARGET" bash -s -- "$SITE_DIR" "$BOT_SHIP_REPO" <<'REMOTE'
set -euo pipefail
SITE_DIR="$1"; BOT_SHIP_REPO="$2"
cd "$SITE_DIR"

echo "--- web_games"
git pull --ff-only
git log -1 --format='    now at %h %s (%cr)'

echo "--- bot-ship-game"
if [[ -d bot-ship-game/.git ]]; then
    git -C bot-ship-game pull --ff-only
else
    git clone --depth 1 "$BOT_SHIP_REPO" bot-ship-game
fi
git -C bot-ship-game log -1 --format='    now at %h %s (%cr)'
REMOTE

echo "Done: https://web-games.ruybalid.com/"
