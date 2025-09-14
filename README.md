# Browser-Based Connections AI Game

A streamlined, browser-based version of the NYT Connections game with AI assistance. No downloads or dependencies required - runs entirely in your web browser!

## What's Included

This simplified version focuses only on the core gameplay functionality:

- **index.html** - Beautiful, responsive web interface
- **connections_game.js** - Main game logic and UI handling
- **game_logic.js** - Core AI algorithms and game rules
- **server.py** - Simple Python web server
- **main.py** - Easy startup script
- **fasttext/** - Game data files (word lists and similarity matrices)

## How to Play

1. **Start the server:**
   ```bash
   python main.py
   ```
   
2. **Your browser will automatically open to the game**
   - If not, go to: http://localhost:8000

3. **Play the game:**
   - Enter a game number (0-379) or click "Random Game"
   - Select 4 words you think form a group
   - Use AI suggestions for help - they're ranked by confidence
   - Click "Submit Guess" to test your selection

4. **Game feedback:**
   - ✅ **Correct** - You found a group!
   - ⚠️ **One Away** - 3 out of 4 words are correct
   - ❌ **Incorrect** - Try again

5. **Win condition:** Find all 4 groups to complete the game

## Features

### ✨ **Zero Dependencies**
- No pygame, no complex installations
- Just Python (built-in libraries) + any web browser
- Works on any device with a browser

### 🤖 **Smart AI Assistant**
- AI provides ranked suggestions based on word similarity
- Click any suggestion to auto-select those words
- Special "one away" assistance when you're close

### 🎨 **Beautiful Interface**
- Modern, responsive design
- Dark theme with smooth animations
- Mobile-friendly layout
- Visual feedback for all actions

### 🎮 **Rich Gameplay**
- 380 different Connections games available
- Real-time turn counting and progress tracking
- Group completion indicators
- Mistake counting and final scoring

## Technical Details

### **Frontend (Browser)**
- Pure HTML5, CSS3, and vanilla JavaScript
- No external frameworks or libraries
- Responsive design works on desktop and mobile

### **Backend (Python)**
- Lightweight HTTP server using Python's built-in modules
- RESTful API for game data
- Only requires `numpy` for loading game data

### **Game Data**
- Pre-processed word similarity data from FastText embeddings
- Each game contains 16 words forming 4 connected groups
- Adjacency matrices for AI similarity calculations

## Requirements

- **Python 3.6+**
- **numpy** (for loading game data)
- **Any modern web browser**

### Install numpy:
```bash
pip install numpy
```

## Advanced Usage

### **Custom Port**
```bash
python main.py 8080  # Run on port 8080
```

### **Direct Server**
```bash
python server.py --port 8000
```

### **API Access**
- Get game data: `GET /api/game/{game_number}`
- Returns JSON with words and similarity matrix

## Game Strategy Tips

1. **Use AI suggestions** - They're based on sophisticated word similarity analysis
2. **Look for obvious connections** first (colors, animals, etc.)
3. **Pay attention to "one away"** feedback - it means you're very close
4. **Try different word orders** - Sometimes the AI finds patterns you missed

## What Was Simplified

- ❌ Removed pygame completely
- ❌ Removed genetic optimization and outcome generation  
- ❌ Removed numba compilation requirements
- ❌ Removed heavy ML dependencies
- ✅ Added beautiful web interface
- ✅ Made it accessible from any device
- ✅ Maintained all core AI functionality
- ✅ Added mobile responsiveness

The game now runs in any web browser with a clean, modern interface while preserving all the intelligent AI assistance features!
