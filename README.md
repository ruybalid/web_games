# Arcade Hub

This is a collection of web games developed with AI for fun and for learning purposes.


## Setup

1. Install python 3.10 or higher.
2. Install git bash (or WSL)
3. Install Antigravity IDE (https://antigravity.google/)
4. Log into antigravity with your google account.
5. Clone the web games to a local directory like C:\dev\web_games, for example:
    * Open a gitbash terminal
    * cd C:\dev
    * run `git clone https://github.com/ruybalid/web_games.git`
6. Open the web_games folder in antigravity.

## How to run the games locally

```bash
python -m http.server 8000
```

Or run the `sh start_server.sh` script in bash

Then open http://localhost:8000 in your browser.


## How to add a new game

1. Create a new folder for the game
2. Create a prompt for the game in the game folder. See the other games for examples.
3. Tell the AI Agent to create the game by copy-pasting the prompt into the Agent window.
4. Run `python generate_games.py` to update `games.json`.
5. Run `sh start_server.sh` to start the server.
6. Open http://localhost:8000 in your browser.




## Deploying to web-games.ruybalid.com

### How the site is set up

- The site lives on Bluehost (shared hosting) in `~/public_html/web_games`, account `ruybalid`.
- That folder is a git clone of this repo (`https://github.com/ruybalid/web_games`). Deploying means running `git pull` there.
- bot-ship-game (Ship AI Arena) is its own repo, `https://github.com/DonkeyCow74/bot-ship-game`. It is cloned into `~/public_html/web_games/bot-ship-game`, and this repo ignores that folder. `external_games.json` adds it to `games.json`.
- `.htaccess` stops the server from serving the `.git` folders.
- The server pulls from GitHub, not from your PC. **Push first, then deploy.**

### Deploy

From WSL, Git Bash, macOS or Linux, in this folder:

```bash
./deploy.sh
```

It checks that this repo and `../bot-ship-game` have no unpushed commits, then SSHes to Bluehost and pulls both repos. Use `./deploy.sh --force` to skip the unpushed-commit check.

To deploy by hand instead:

```bash
ssh ruybalid@ruybalid.com
cd ~/public_html/web_games && git pull
cd bot-ship-game && git pull
```

### One-time setup for a new computer or person

You need bash, git and ssh, plus SSH access to the Bluehost account.

1. **Make an SSH key** (one per person and computer; never share private keys):
   ```bash
   ssh-keygen -t ed25519 -C "your-name web-games deploy" -f ~/.ssh/bluehost
   cat ~/.ssh/bluehost.pub      # this public half is what gets sent / uploaded
   ```
2. **Authorize the key on Bluehost** (the account owner does this):
   - Bluehost Portal → Websites → Manage Site → Files & Access → SSH → Manage. Make sure **Shell Access** is on.
   - Open the SSH key manager, **Import Key**, paste the public key, then **Manage → Authorize**.
   - For a deploy-only key, see "Letting other people deploy" below instead.
3. **Point SSH at the key** by adding this to `~/.ssh/config`:
   ```
   Host ruybalid.com bluehost
       HostName ruybalid.com
       User ruybalid
       IdentityFile ~/.ssh/bluehost
       IdentitiesOnly yes
   ```
   Test it with `ssh ruybalid@ruybalid.com` (or `ssh bluehost`).
4. **Create `deploy.config`**, which git ignores, so everyone makes their own:
   ```bash
   cp deploy.config.example deploy.config
   ```
   Set `SSH_TARGET="bluehost"` (or `ruybalid@ruybalid.com`) and `SITE_DIR="public_html/web_games"`.
5. Optionally clone bot-ship-game next to this repo (`../bot-ship-game`) so `deploy.sh` can check it for unpushed commits.

### Letting other people deploy

**Warning:** a normal SSH key gives full shell access to the whole Bluehost account: every site, every file and the email settings. Shared hosting has no way to limit a key to one folder.

To let someone deploy without that access, give their key a **deploy-only** entry. SSH in as the owner and add one line to `~/.ssh/authorized_keys`, all on one line, with their public key at the end:

```
command="cd ~/public_html/web_games && git pull --ff-only && git -C bot-ship-game pull --ff-only",restrict ssh-ed25519 AAAA...their-key... friend-name
```

With this entry, that key can only run the deploy. Their `./deploy.sh` still works, and so does a plain `ssh ruybalid@ruybalid.com`: either one just runs the pull and disconnects. Add these lines by editing the file over SSH, not with cPanel's Import Key. To remove someone's access, delete their line.

They also need steps 1, 3 and 4 above. They only need push access to the GitHub repos if they are also the ones shipping the changes.

### Troubleshooting

- **`Permission denied (publickey)`**: the key isn't authorized on Bluehost, or `~/.ssh/config` points at the wrong file. Check with `ssh -v bluehost`.
- **The connection hangs**: try port 2222 (`SSH_PORT=2222` in `deploy.config`), or check that Shell Access is still on in the Bluehost Portal.
- **`Not possible to fast-forward`**: someone edited files directly on the server. SSH in and run `git status` in the site folder to see what changed.
- **`couldn't reach GitHub for ../bot-ship-game, skipping check`**: harmless. Your machine has no GitHub SSH key for that repo, so `deploy.sh` skipped only the unpushed-commit check.
- **A new game doesn't show on the hub**: run `python generate_games.py`, then commit and push `games.json`. For a game in its own repo, also add it to `external_games.json`.
