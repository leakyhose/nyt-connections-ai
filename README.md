# NYT CONNECTIONS AI

An AI solver for NYT Connections puzzles using graph theory and word embeddings.

## Usage

### Web Interface

You can play with the demonstration [here](https://leakyhose.github.io/nyt-connections-ai/).

If you want to run it locally, you can install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000/nyt-connections-ai/` in your browser. Load games by number or randomly, and view AI-generated suggestions ranked by likelihood.

For production build:

```bash
npm run build
npm run preview
```

### CLI Solver

Run the solver against all games:

```bash
node cli-solver.js
```

Output shows success rate, average attempts, and performance statistics across 640+ games.

## Project Structure

```
├── public/
│   ├── firebase-config.js  # Firebase initialization
│   └── data/               # Individual Connections Game files (640+ JSON files)
├── extract/                # Scripts and data used to build/prepare datasets
│   ├── extract.py          # Script to pull and preprocess word lists / game data
│   └── full_words.txt      # Full word list used by extraction/preprocessing
├── index.html              # Web interface
├── styles.css              # UI styling
├── ai-solver.js            # Core AI algorithms (shared)
├── web-app.js              # Web application logic
├── cli-solver.js           # Command-line batch solver
├── vite.config.js          # Vite build configuration
└── package.json            # Dependencies and scripts
```
## How It Works

The AI uses graph theory to evaluate potential word groupings based on semantic similarity.

### Core Algorithm

Each game contains 16 words with a pre-computed adjacency matrix representing semantic similarity between word pairs. The similarity values come from FastText word embeddings, measuring how often words appear in similar contexts.

Two metrics evaluate each possible 4-word combination:

**Density** - Internal group cohesion
```
density = Σ(adjacency[i][j]) / n²
```
Measures how strongly words within a group relate to each other.

**Conductance** - External separation
```
conductance = 1 - external_edges / (2 * internal_edges + external_edges)
```
Measures how distinct the group is from remaining words.

### Ranking

Groups are scored using weighted combination:
```
score = w1 * conductance + w2 * density
```

Current weights `[0.744, 0.060]` were optimized using a genetic algorithm trained on historical game data. The AI generates all possible 4-word combinations, scores them, and ranks by likelihood.

### Solving Process

The AI iteratively:
1. Generates ranked suggestions from remaining words
2. Attempts the highest-scoring combination
3. If correct, removes those words and repeats
4. If incorrect, marks that combination as tried and moves to next suggestion
5. Continues until all 4 groups found or max attempts reached

### Limitations

The AI struggles with:
- Proper nouns and names
- Wordplay categories (homophones, rhymes)
- Letter/spelling-based connections
- Categories requiring cultural knowledge

These rely on non-semantic patterns that word embeddings cannot capture. On such games, the AI may require 40+ attempts as it exhausts semantic groupings.

## Data Format

Each game file contains:

```json
{
  "game_number": 42,
  "words": ["WORD1", "WORD2", ..., "WORD16"],
  "adjacency_matrix": [
    [1.0, 0.45, 0.23, ...],
    [0.45, 1.0, 0.67, ...],
    ...
  ]
}
```