# Connections AI

A bot that solves NYT Connections games.

## Overview

This application presents 16 words that form 4 groups of 4 connected words each. The AI identifies the groups it sees as the best guesses, with the player able to choose out of the ranked options it produces.

## Project Structure

```
ConnectionsAI/
├── index.html              # Main game interface
├── connections_game.js     # Game state management and UI logic
├── game_logic.js          # AI algorithms for suggestion generation
├── game_data_loader.js    # Client-side data loading system
└── data/                  # Game data files
    ├── games_index.json   # Index of available games
    └── game_*.json        # Individual game data files
```

### AI Calculation Method

The AI suggestions are generated using two primary algorithms:

#### Density Calculation
Measures internal connectivity within a subset of words:
```
density = sum(adjacency_values_within_subset) / (subset_size^2)
```

#### Conductance Calculation  
Measures how well a subset is separated from the rest:
```
conductance = 1 - external_connections / (2 * internal_connections + external_connections)
```

### Word Similarity Data

The adjacency matrix values are derived from FastText word embeddings, representing semantic similarity between word pairs. Values range from 0 to 1, where higher values indicate stronger semantic relationships.

### Data Format
Game data is stored in JSON format:
```json
{
  "game_number": 0,
  "words": ["WORD1", "WORD2", ...],
  "adjacency_matrix": [[similarity_scores]]
}
```

### Weighting System
The current implementation uses empirically determined weights:
- Density weight: 0.744
- Conductance weight: 0.060

These values were optimized for the specific word similarity data used in the game.

### Limitations
- AI suggestions are based on semantic similarity only
- Does not account for literal connections (eg. Words ending in -ing), relying on purely semantics.
- Performance depends on quality of underlying word embedding data
- May struggle with proper nouns or domain-specific terminology

