import json
from pathlib import Path

def generate_games_json():
    print("Generating games.json...")
    games = []
    
    # Scan current directory for game folders
    base_dir = Path('.')
    for item in base_dir.iterdir():
        if item.is_dir() and item.name not in ['.git', '.vscode', '__pycache__']:
            # Assuming the game's main html file is named after the folder
            html_file = base_dir / item.name / f"{item.name}.html"
            if html_file.exists():
                game_name = item.name.replace('_', ' ').replace('-', ' ').title()
                games.append({
                    'id': item.name,
                    'name': game_name,
                    'path': f"./{html_file}",
                    'desc': f"Play {game_name}"
                })
                print(f"Found game: {game_name}")
    
    # Write to games.json
    with open('games.json', 'w', encoding='utf-8') as f:
        json.dump(games, f, indent=4)
        
    print(f"Successfully generated games.json with {len(games)} games!")

if __name__ == '__main__':
    generate_games_json()
