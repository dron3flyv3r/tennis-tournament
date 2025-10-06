# 🎾 Tennis Tournament Generator

An automatic tennis tournament generator built with React, TypeScript, and Vite. This application helps you organize tennis tournaments with customizable settings, automatic match scheduling, score tracking, and comprehensive reporting.

## ✨ Features

### Tournament Configuration
- **Game Types**: Singles or Doubles matches
- **Doubles Partner Modes**: 
  - Fixed partners (pre-defined teams)
  - Random non-repeating partners (ensures players don't partner with the same person twice)
- **Configurable Courts**: Add multiple courts with custom names
- **Flexible Scheduling**: Set start time and match duration
- **Match Constraints**:
  - Non-repeating matches (players don't face the same opponents twice)
  - Fair matches (everyone plays the same number of games)
  - Optional bypass mode when constraints cannot be fully satisfied

### Player Management
- Add unlimited players
- Optional skill level ratings (1-10 scale)
- Easy player editing and removal
- Player list is saved during tournament configuration

### Match Management
- Automatic match generation based on configured rules
- **✨ NEW: Round-based view** - Matches organized by time slots for better overview
- **✨ NEW: Collapsible rounds** - Click round headers to expand/collapse
- **✨ NEW: Round status tracking** - See which rounds are completed, in progress, or pending
- **✨ NEW: Quick controls** - Expand All / Collapse All buttons
- Visual match cards showing:
  - Match time and court assignment
  - Team/player names
  - Match status (pending/completed)
- Easy score entry with multiple sets support
- Edit scores after entry
- **✨ Edit Tournament** - Modify players and matches after tournament starts
- **✨ Manual Match Setup** - Add, remove, or modify matches manually

### Data Persistence
- **✨ NEW: Cookie Storage** - Tournament state automatically saved to cookies
- **✨ NEW: Auto-restore** - Resume tournament when you return to the app
- **✨ NEW: 7-day persistence** - Cookies last for 7 days
- **✨ NEW: Start fresh option** - Clear saved state and begin new tournament

### Tournament Reports
- **Player Statistics Table**:
  - Matches played, won, and lost
  - Win rate percentage
  - Sets won/lost
  - Games won/lost
  - Ranking with medals for top 3 players

- **Fun Stats & Highlights**:
  - 🏆 Most Wins
  - ⭐ Highest Win Rate
  - 🎾 Most Active Player
  - 💥 Biggest Win

- **Progress Tracking**: View completion percentage and completed vs. total matches

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd tennis-tournament
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed.

## 📖 Usage Guide

### 1. Configure Your Tournament

1. Enter a tournament name
2. Select game type (Singles or Doubles)
3. For doubles, choose partner mode:
   - **Fixed Partners**: Players are paired sequentially (Player 1 & 2, Player 3 & 4, etc.)
   - **Random Non-Repeating Partners**: Algorithm ensures variety in partnerships
4. Set start time and match duration
5. Configure match constraints:
   - ✅ **Enforce Non-Repeating Matches**: Players won't face the same opponents twice
   - ✅ **Enforce Fair Matches**: Algorithm tries to give everyone equal playing time
   - ✅ **Allow Bypass**: Show a confirmation dialog if constraints can't be met

### 2. Add Courts

1. Enter court name (e.g., "Court 1", "Center Court", "Court A")
2. Click "Add Court"
3. Add as many courts as needed
4. Remove courts by clicking "Remove"

### 3. Add Players

1. Enter player name
2. Set optional skill level (1-10)
3. Click "Add Player"
4. Edit player details inline
5. Remove players by clicking "Remove"

### 4. Generate Tournament

Click "Generate Tournament" to create the match schedule. If warnings appear and bypass mode is enabled, you'll see a confirmation dialog.

**New Round-Based View:** 
Matches are now organized into rounds (time slots) for a much clearer overview:
- Each round shows all matches that happen at the same time
- Click on round headers to expand/collapse sections
- Use "Expand All" or "Collapse All" for quick navigation
- Rounds show status badges: ✓ Done, In Progress, or Pending
- The first incomplete round opens automatically for convenience

### 5. Enter Match Scores

1. Click "Enter Score" on any match card
2. Input game scores for each set (e.g., 6-4, 6-3)
3. Add additional sets if needed
4. Click "Save Score" to complete the match
5. Edit scores later by clicking "Edit Score"

### 6. View Report

Click "📊 View Report" to see comprehensive tournament statistics including player rankings, win rates, and fun highlights.

### 7. Edit Tournament (NEW! ✨)

Need to make changes after starting the tournament?

1. Click "✏️ Edit Tournament" button in the tournament view
2. **Edit Players Tab:**
   - Add new players
   - Remove players (if not in matches)
   - Update player names and skill levels
   - Changes propagate to all matches
3. **Edit Matches Tab:**
   - Add new matches manually
   - Delete matches
   - Change match time and court
   - Reassign players to different teams
   - View match completion status

**Use Cases:**
- Player needs to leave early → Remove them from future matches
- Add a late-arriving player
- Fix incorrectly assigned matches
- Create custom matchups
- Adjust match schedule times

### 8. Automatic Save & Restore (NEW! 🍪)

Your tournament is automatically saved:
- State saved to cookies every time you make changes
- Data persists for 7 days
- When you return, you'll see a prompt to continue or start fresh
- No manual save needed!

## 🏗️ Project Structure

```
tennis-tournament/
├── src/
│   ├── components/
│   │   ├── ConfigPanel.tsx       # Tournament configuration UI
│   │   ├── ConfigPanel.css
│   │   ├── TournamentView.tsx    # Main tournament view
│   │   ├── TournamentView.css
│   │   ├── MatchCard.tsx         # Individual match display
│   │   ├── MatchCard.css
│   │   ├── TournamentReport.tsx  # Statistics and report
│   │   ├── TournamentReport.css
│   │   ├── EditTournamentModal.tsx  # NEW: Edit tournament modal
│   │   └── EditTournamentModal.css
│   ├── types.ts                  # TypeScript type definitions
│   ├── tournamentUtils.ts        # Match generation algorithms
│   ├── cookieUtils.ts            # NEW: Cookie storage utilities
│   ├── App.tsx                   # Main application component
│   ├── App.css
│   ├── main.tsx                  # Application entry point
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Key Features Explained

### Match Generation Algorithms

**Singles Matches:**
- Round-robin format when fair matches are enabled
- Every player faces every other player once
- Optimal court and time assignment

**Doubles Matches with Fixed Partners:**
- Players paired sequentially
- All team combinations play each other
- Balanced scheduling across courts

**Doubles Matches with Random Non-Repeating Partners:**
- Advanced algorithm ensures unique partnerships
- Players don't partner with the same person twice
- Players don't face the same opponents twice (when enabled)
- Fair distribution of matches

### Score Tracking

Supports standard tennis scoring:
- Multiple sets per match
- Games per set (0-7)
- Winner determination based on sets won
- Detailed statistics calculation

### Smart Warnings

The system alerts you when:
- Not enough players for game type
- Constraints cannot be fully satisfied
- Match fairness cannot be perfectly achieved

## 🛠️ Technologies Used

- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **CSS3**: Custom styling with gradients and animations
- **ESLint**: Code quality and consistency

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.

## 🎮 Tips for Best Results

1. **For Singles**: Add at least 4 players for an interesting tournament
2. **For Doubles**: Ensure you have at least 6-8 players for variety
3. **Random Partners Mode**: Works best with 8+ players
4. **Fair Matches**: Enable this for recreational tournaments
5. **Multiple Courts**: Add more courts to speed up tournament completion
6. **Skill Levels**: Use skill levels for seeding or reference, they're optional but helpful

## 🐛 Troubleshooting

**Tournament won't generate:**
- Check that you have enough players (2+ for singles, 4+ for doubles)
- Ensure at least one court is configured
- Try disabling "Enforce Non-Repeating Matches" if you have few players

**Warnings about fairness:**
- With constraints enabled and few players, perfect fairness may be impossible
- Use bypass mode to proceed anyway
- Add more players for better results

**Score entry issues:**
- Ensure game scores are realistic (0-7)
- Add at least one set before saving
- Use "Add Set" button for best-of-3 or best-of-5 matches

**Need to modify tournament after starting:**
- Use the "✏️ Edit Tournament" button
- Add/remove players or matches as needed
- Changes are saved automatically

**Lost your tournament?**
- Tournament data is saved in cookies for 7 days
- Reload the page - you'll be prompted to continue
- Clear browser cookies to start completely fresh

---

Made with ❤️ for tennis enthusiasts!
