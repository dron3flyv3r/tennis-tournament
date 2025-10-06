# Break and Bench Features Implementation

## Overview
This document describes the implementation of two new features for the Tennis Tournament application:
1. **Break Settings**: Configure break duration between matches and schedule specific breaks
2. **Bench Display**: Show which players are sitting out during each round

## Features Implemented

### 1. Break Settings

#### Break Duration Between Matches
- Added a `breakDuration` field to the tournament configuration
- Allows setting a default break time (0-60 minutes) between match rounds
- When set to 0, matches run back-to-back with no breaks
- Applied automatically when scheduling matches

#### Scheduled Breaks
- Added support for optional scheduled breaks (e.g., lunch breaks)
- Each scheduled break includes:
  - **Time**: When the break should occur (HH:MM format)
  - **Duration**: How long the break lasts (in minutes)
- Scheduled breaks are automatically sorted by time
- Multiple breaks can be added throughout the tournament
- The match scheduling algorithm automatically accounts for these breaks

#### UI Updates in ConfigPanel
- New section: "Scheduled Breaks (Optional)"
- Input fields:
  - Time picker for break start time
  - Number input for break duration
  - "Add Break" button to add scheduled breaks
- Display of all scheduled breaks with emoji 🪑 and delete buttons
- Color-coded yellow theme for breaks section for easy visibility
- Fully responsive design for mobile devices

### 2. Bench Display

#### Functionality
- Shows players who are NOT playing in each round
- Displayed at the bottom of each expanded round
- Only appears when there are players on the bench (hidden when everyone is playing)
- Calculates in real-time which players are sitting out based on match assignments

#### UI Design
- New "🪑 On the Bench" section below match cards
- Players displayed as pills/badges with yellow theme
- Color-coded to match the warning/info aesthetic
- Clean, readable layout with flexbox wrapping
- Border accent on the left side for visual hierarchy

### 3. Technical Changes

#### Type Definitions (`types.ts`)
```typescript
export interface ScheduledBreak {
  id: string;
  time: string; // HH:MM format
  duration: number; // in minutes
}

export interface TournamentConfig {
  // ... existing fields
  breakDuration: number; // default break between matches in minutes
  scheduledBreaks: ScheduledBreak[]; // optional scheduled breaks
}
```

#### Tournament Utils (`tournamentUtils.ts`)
- Enhanced `assignCourtsAndTimes()` function to:
  - Apply break duration between match rounds
  - Check for scheduled breaks before assigning match times
  - Skip matches over scheduled break periods
  - Reset court index after scheduled breaks for proper scheduling

#### Config Panel (`ConfigPanel.tsx`)
- Added state management for scheduled breaks
- New handlers: `handleAddScheduledBreak()`, `handleRemoveScheduledBreak()`
- Automatic sorting of breaks by time
- Form inputs for break duration and scheduled breaks

#### Tournament View (`TournamentView.tsx`)
- New function: `getPlayersOnBench(round)` 
- Calculates which players are not in any matches for a given round
- Conditional rendering of bench section
- Integrated seamlessly into existing round expansion UI

#### Styling
- **ConfigPanel.css**: Added styles for breaks section, break items, and responsive layouts
- **TournamentView.css**: Added styles for bench section, bench player badges, and titles

## Usage

### Setting Break Duration
1. Go to the tournament setup page
2. Find "Break Between Matches (minutes)" field
3. Set the desired break duration (0-60 minutes)
4. This break is applied between every round of matches

### Adding Scheduled Breaks
1. Scroll to "Scheduled Breaks (Optional)" section
2. Select the time for the break
3. Enter the duration in minutes
4. Click "Add Break"
5. The break appears in the list and will be applied during tournament scheduling

### Viewing Players on the Bench
1. Start a tournament
2. Expand any round to view matches
3. If players are sitting out that round, they appear in the "On the Bench" section
4. The section is automatically hidden if all players are competing

## Benefits

1. **More Realistic Scheduling**: Tournaments can now include realistic breaks for meals, rest, or other activities
2. **Better Player Management**: Tournament organizers can see at a glance who isn't playing
3. **Flexible Configuration**: Both default breaks and specific scheduled breaks supported
4. **User-Friendly**: Clear UI with visual indicators and responsive design
5. **Automatic Handling**: The system automatically schedules around breaks without manual intervention

## Mobile Responsiveness

All new features are fully responsive:
- Break inputs stack vertically on small screens
- Bench player badges wrap appropriately
- Touch-friendly button sizes
- Proper font sizing for mobile devices

## Future Enhancements (Potential)

- Export schedule with breaks clearly marked
- Visual timeline showing matches and breaks
- Break notifications/reminders
- Auto-suggest break times based on match count
- Player rotation optimization to minimize bench time
