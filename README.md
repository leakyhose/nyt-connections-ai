# ConnectionsAI

An AI solver for NYT Connections puzzles using graph theory algorithms.

## Quick Start

### Web Interface
Open `index.html` in a browser or run:
```bash
python server.py
```
Visit `http://localhost:8000`

### Game Solver
```bash
node game_solver.js
```

## Structure
```
ConnectionsAI/
├── index.html              # Web interface
├── connections_game.js     # Game logic
├── game_logic.js          # AI algorithms
├── game_data_loader.js    # Data loading
├── game_solver.js         # Command-line solver
├── server.py              # Local web server
├── data/                  # Game data (JSON)
├── extract/               # Word extraction tools
│   ├── extract.py         # Word processing utilities
│   └── full_words.txt     # Master word list
└── _config.yml            # GitHub Pages config
```

## AI Method

The solver uses two algorithms:

**Density:** Internal connectivity within word groups
```
density = sum(adjacency_values) / (group_size^2)
```

**Conductance:** Separation between groups
```
conductance = 1 - external_connections / (2 * internal + external)
```

Word similarity data comes from FastText embeddings. Current weights: density (0.744), conductance (0.060).

## Data Format

Games are stored as JSON:
```json
{
  "game_number": 0,
  "words": ["WORD1", "WORD2", ...],
  "adjacency_matrix": [[similarity_scores]]
}
```

## Files

**Web Interface:**
- `index.html` - Main game interface
- `server.py` - Local web server with API
- `connections_game.js` - Game state and UI
- `game_logic.js` - Client-side AI algorithms
- `game_data_loader.js` - Data loading and caching

**Tools:**
- `game_solver.js` - Command-line solver
- `extract/extract.py` - Word extraction utilities
- `extract/full_words.txt` - Master word list

**Data:**
- `data/games_index.json` - Game index
- `data/game_*.json` - Individual game files

## Requirements

**Web:** Modern browser with JavaScript
**Tools:** Python 3.7+ (no external packages required)

## Adding Games

1. Add words to `extract/full_words.txt`
2. Use extraction tools to process data
3. Games appear automatically in web interface