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

The site on Bluehost is a git clone of this repo. bot-ship-game is its own repo (DonkeyCow74/bot-ship-game), cloned into a `bot-ship-game/` folder inside the site. `external_games.json` lists it so it shows up in `games.json`.

One-time setup:
1. In Bluehost, turn on SSH access and add your public key (cPanel → Security → SSH Access → Manage SSH Keys, then authorize it).
2. `cp deploy.config.example deploy.config` and fill in your SSH login and the site folder.

To deploy: push your changes to GitHub (in web_games and/or bot-ship-game), then run in Git Bash:

```bash
./deploy.sh
```
