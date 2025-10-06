# 🚀 Quick Start Guide

## Get Running in 30 Seconds!

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:5173`

3. **First Time? / Returning?**
   - **First time:** Click "🎯 Load Sample Data" button
   - **Returning:** You'll see a welcome prompt - click "Continue Tournament" to resume

4. **Generate tournament:**
   Click "Generate Tournament"
   
   **New! Matches are organized by rounds:**
   - Each round = matches at the same time
   - Click round headers to expand/collapse
   - Use "Expand All" / "Collapse All" buttons
   - First incomplete round opens automatically

5. **Enter scores:**
   Click "Enter Score" on any match and input game scores

6. **Need to make changes? ✨ NEW!**
   Click "✏️ Edit Tournament" to modify players or matches

7. **View report:**
   Click "📊 View Report" to see statistics

## Example Workflow

### Singles Tournament
1. Load sample data (8 players with skill levels)
2. Keep default settings (Singles, 3 courts)
3. Generate tournament (you'll get 28 matches)
4. Enter scores for a few matches
5. View report to see rankings and stats

### Doubles Tournament
1. Load sample data
2. Change game type to "Doubles"
3. Select "Random Non-Repeating Partners"
4. Generate tournament
5. Enter scores and view report

## Quick Tips

- **Need more players?** Just click "Add Player" and enter names
- **Want more courts?** Add them in the Courts section
- **Fair matches?** Enable "Enforce Fair Matches" checkbox
- **Can't satisfy constraints?** Enable "Allow Bypass" to proceed anyway
- **Edit a score?** Click "Edit Score" on any completed match
- **✨ View specific round?** Click on round headers to expand/collapse
- **✨ See all matches?** Click "Expand All" button
- **✨ Clean view?** Click "Collapse All" and open rounds as needed
- **✨ Player left early?** Use "Edit Tournament" → remove them from future matches
- **✨ Add late player?** Use "Edit Tournament" → Players tab → Add Player
- **✨ Manual match setup?** Use "Edit Tournament" → Matches tab
- **✨ Auto-saved!** Your tournament saves automatically - just reload to continue

## Testing Different Scenarios

### Small Tournament (4 players)
- Uncheck "Enforce Non-Repeating Matches"
- Great for quick testing

### Large Tournament (12+ players)
- Add more courts (4-6)
- Increase match duration if needed
- Works great for club tournaments

### Doubles with Fixed Partners
- Add even number of players (4, 6, 8, etc.)
- Players paired sequentially (1&2, 3&4, etc.)
- Good for pre-arranged teams

### Doubles with Random Partners
- Add 6-8+ players for best results
- Everyone gets different partners
- Great for social tournaments

## Common Issues

**"Please add at least X players"**
- Add more players using the form

**"Unable to create perfectly fair matches"**
- This is just a warning
- Click OK to proceed
- Match distribution is still good

## Common Scenarios ✨ NEW!

### Player Needs to Leave Early
1. Click "✏️ Edit Tournament"
2. Go to Matches tab
3. Find their matches
4. Click on their name dropdown and select a replacement
5. Or delete those matches entirely
6. Click "Save Changes"

### Adding a Late Player
1. Click "✏️ Edit Tournament"
2. Go to Players tab
3. Add the new player
4. Switch to Matches tab
5. Add new matches or modify existing ones to include them
6. Click "Save Changes"

### Creating a Custom Match
1. Click "✏️ Edit Tournament"
2. Go to Matches tab
3. Click "+ Add Match"
4. Select court and time
5. Assign players to each team
6. Click "Save Changes"

### Fixing Wrong Matchups
1. Click "✏️ Edit Tournament"
2. Go to Matches tab
3. Use player dropdowns to reassign teams
4. Click "Save Changes"

---

Enjoy your tournament! 🎾
