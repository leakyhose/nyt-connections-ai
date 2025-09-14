# Connections AI - GitHub Pages Edition

A beautiful, browser-based version of the NYT Connections game with AI assistance. **Runs entirely as a static website** - no server or downloads required!

🎮 **[Play the Game](https://your-username.github.io/ConnectionsAI/)** ← Replace with your actual GitHub Pages URL

## ✨ Features

- **🌐 Runs on GitHub Pages** - No installation or server setup required
- **🤖 AI-Powered Suggestions** - Smart word grouping recommendations
- **🎨 Beautiful Interface** - Modern, responsive design with dark theme
- **📱 Mobile Friendly** - Works perfectly on all devices
- **⚡ Lightning Fast** - Pure client-side JavaScript, loads instantly
- **🎯 380 Games Available** - Plenty of content to explore

## How to Play

1. **Open the game** in your web browser (GitHub Pages link above)
2. **Enter a game number** (0-379) or click "Random Game"
3. **Select 4 words** you think form a group
4. **Use AI suggestions** for help - they're ranked by confidence!
5. **Submit your guess** and get instant feedback:
   - ✅ **Correct** - You found a group!
   - ⚠️ **One Away** - 3 out of 4 words are correct
   - ❌ **Incorrect** - Try again
6. **Find all 4 groups** to win the game!

## 🚀 Deploy Your Own Copy

Want to host your own version? It's easy!

### Option 1: Fork and Deploy
1. **Fork this repository** on GitHub
2. **Go to Settings** → **Pages** 
3. **Select "Deploy from a branch"** → **main branch**
4. **Your game will be live** at `https://yourusername.github.io/ConnectionsAI/`

### Option 2: Download and Host Anywhere
1. **Download** or clone this repository
2. **Upload the files** to any web hosting service
3. **Make sure** the `data/` folder with JSON files is included
4. **Open `index.html`** in a web browser

## 🎮 Game Features

### **Smart AI Assistant**
- AI provides ranked suggestions based on word similarity
- Click any suggestion to auto-select those words
- Special "one away" assistance when you're close
- Uses FastText word embeddings for intelligent groupings

### **Beautiful Interface**
- Modern, responsive design that works on all devices
- Dark theme with smooth animations and transitions
- Visual feedback for all actions and game states
- Mobile-optimized touch interface

### **Rich Gameplay**
- 380 different Connections games available
- Real-time turn counting and progress tracking
- Group completion indicators with color coding
- Mistake counting and comprehensive scoring

## 📁 Project Structure

```
ConnectionsAI/
├── index.html              # Main game interface
├── connections_game.js     # Game logic and UI handling
├── game_logic.js          # AI algorithms and game rules
├── game_data_loader.js    # Client-side data loading
├── data/                  # Game data (JSON files)
│   ├── games_index.json   # Index of all available games
│   ├── game_0.json        # Individual game files
│   ├── game_1.json
│   └── ...
└── README.md              # You are here!
```

## 🛠️ Technical Details

### **Frontend Technologies**
- **HTML5** with semantic markup and accessibility features
- **CSS3** with modern flexbox layout and animations
- **Vanilla JavaScript** (ES6+) - no external dependencies
- **JSON data files** for fast, client-side game loading

### **Performance Features**
- **Game data caching** for instant loading of previously played games
- **Lazy loading** of game data only when needed
- **Optimized JSON format** for minimal bandwidth usage
- **Client-side processing** for zero server latency

### **Mobile Optimization**
- **Responsive design** that adapts to any screen size
- **Touch-friendly** interface with appropriate button sizes
- **Viewport optimization** for mobile browsers
- **Fast loading** even on slower mobile connections

## 🎯 Game Strategy Tips

1. **Start with AI suggestions** - They're based on sophisticated similarity analysis
2. **Look for obvious connections first** - Colors, animals, professions, etc.
3. **Pay attention to "one away" feedback** - You're very close to a correct group
4. **Try different word combinations** - The AI finds patterns you might miss
5. **Use the visual feedback** - Selected words are highlighted clearly

## 🔧 For Developers

This project demonstrates:
- **Static site deployment** with dynamic content loading
- **Client-side data management** without a backend
- **Responsive web design** principles
- **Modern JavaScript** without build tools
- **GitHub Pages** hosting best practices

The original Python server has been completely replaced with client-side JavaScript that loads pre-processed game data from JSON files.

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features
- Improve the UI/UX design
- Add new game modes or features
- Optimize performance

---

**Enjoy playing Connections with AI assistance!** 🎮✨

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
