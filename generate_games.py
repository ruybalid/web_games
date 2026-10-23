import json
from pathlib import Path

SKIP_DIRS = {'.git', '.vscode', '__pycache__'}
EXTERNAL_GAMES = Path('external_games.json')


def find_game_page(folder: Path) -> Path | None:
    """A game's page is <folder>/<folder>.html, or <folder>/index.html."""
    for candidate in (folder / f"{folder.name}.html", folder / "index.html"):
        if candidate.exists():
            return candidate
    return None


def generate_games_json():
    print("Generating games.json...")
    games = []

    # Games that live in their own repo and get cloned in on the server
    if EXTERNAL_GAMES.exists():
        for game in json.loads(EXTERNAL_GAMES.read_text(encoding='utf-8')):
            games.append(game)
            print(f"External game: {game['name']}")
    known_ids = {g['id'] for g in games}

    # Scan current directory for game folders
    base_dir = Path('.')
    for item in sorted(base_dir.iterdir()):
        if not item.is_dir() or item.name in SKIP_DIRS or item.name in known_ids:
            continue
        html_file = find_game_page(item)
        if html_file:
            game_name = item.name.replace('_', ' ').replace('-', ' ').title()
            games.append({
                'id': item.name,
                'name': game_name,
                # as_posix() so the link uses / even when run on Windows
                'path': f"./{html_file.as_posix()}",
                'desc': f"Play {game_name}"
            })
            print(f"Found game: {game_name}")

    with open('games.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(games, f, indent=4)
        f.write('\n')

    print(f"Successfully generated games.json with {len(games)} games!")


if __name__ == '__main__':
    generate_games_json()
