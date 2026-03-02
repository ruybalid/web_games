# Arcade Hub

This is a collection of web games developed with AI for fun and for learning purposes.

## How to run

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.


## How to add a new game

1. Create a new folder for the game.
2. Add the game's html file to the folder.
3. Run `python generate_games.py` to update `games.json`.
4. Run `python -m http.server 8000` to start the server.
5. Open http://localhost:8000 in your browser.
