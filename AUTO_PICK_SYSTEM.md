# Auto-Pick System Documentation

## Overview
The Fantasy Rugby draft now includes an automatic player selection system for users who are not actively participating in the draft.

## How It Works

### Active User Detection
- When a user opens the Draft page, they are automatically marked as "active"
- When they leave the Draft page (navigate away or close tab), they are marked as "inactive"
- The system tracks active users in real-time

### Auto-Pick Trigger
When it's a user's turn to pick and:
1. **Timer expires** (90 seconds countdown reaches 0)
2. **User is not active** (not on the draft page)

Then the system automatically:
1. Selects a random player from the top 10 available players
2. Adds that player to the user's team
3. Marks the player with an "auto-picked" flag
4. Advances to the next pick in the draft order

### Visual Indicators

**Auto-picked players are shown with:**
- 🤖 Robot emoji next to the player name
- Yellow/gold background (#FFF3CD)
- Yellow left border (#FFC107)

**Regular picks:**
- No special indicator
- Gray background
- Standard styling

### Auto-Pick Algorithm

```javascript
// Filter out already selected players
const allSelectedPlayerIds = Object.values(selectedPlayers)
  .flat()
  .map(p => p.id);

const available = availablePlayers.filter(p => !allSelectedPlayerIds.includes(p.id));

// Sort available players by fantasy points per game (highest first)
const sortedByFantasyPoints = available.sort((a, b) => {
  const aPoints = a.fantasy_points_per_game || 0;
  const bPoints = b.fantasy_points_per_game || 0;
  return bPoints - aPoints; // Descending order (highest first)
});

// Pick the player with the highest fantasy points per game
const bestPlayer = sortedByFantasyPoints[0];
```

**Smart Selection:**
- Selects the player with the highest fantasy points per game
- Uses fantasy points data to make optimal picks
- Avoids picking already selected players
- Falls back gracefully if no players available
- Logs the selected player's fantasy points for transparency

## User Experience

### For Active Users
- See timer counting down
- Can select players normally
- No auto-pick occurs

### For Inactive Users
- Timer expires after 90 seconds
- System auto-picks a player
- Player marked with 🤖 icon
- Draft continues automatically

### For Observers
- Can see which players were auto-picked
- Yellow highlighting makes it obvious
- Can still track draft progress

## Technical Implementation

### Frontend Components
1. **useDraftState.js Hook**
   - Tracks active users
   - Implements auto-pick logic
   - Manages timer countdown

2. **Draft.js Page**
   - Marks user as active on mount
   - Marks user as inactive on unmount
   - Passes user status to hook

3. **TeamRoster.js Component**
   - Displays auto-picked players differently
   - Shows 🤖 icon for auto-picks
   - Yellow background for visual distinction

### Backend
- No backend changes required for auto-pick
- All logic handled client-side
- Draft completion still saves all picks (auto or manual)

## Configuration

### Timer Duration
- Default: 90 seconds per pick
- Can be adjusted in useDraftState.js
- Resets after each pick

### Auto-Pick Pool
- Default: Random from top 10 available players
- Can be modified to use different strategies:
  - Best available by position
  - Highest-rated available
  - Position-based needs

## Future Enhancements

### Potential Improvements:
1. **Smart Auto-Pick**
   - Consider team needs (missing positions)
   - Pick highest-rated available player
   - Balance team composition

2. **Pre-Draft Rankings**
   - Let users rank players before draft
   - Auto-pick follows user's rankings
   - More personalized auto-selections

3. **Notification System**
   - Alert users when their turn is coming
   - Send notifications via email/SMS
   - Reduce auto-picks by keeping users engaged

4. **Draft Pause**
   - Admin can pause draft for specific users
   - Wait for user to return
   - Resume when ready

5. **Historical Analytics**
   - Track auto-pick vs manual pick success rates
   - Show which auto-picks performed well
   - Improve algorithm over time

## Testing

### Manual Test Scenarios:

1. **Single Inactive User**
   - Join draft as User A
   - Navigate away from draft page
   - Wait 90 seconds
   - Verify auto-pick occurs

2. **Multiple Inactive Users**
   - Have 6 teams in league
   - Only 2 users on draft page
   - Verify auto-picks for 4 inactive users

3. **All Inactive Users**
   - Start draft with no users on page
   - Verify entire draft completes automatically
   - Check all players marked as auto-picked

4. **User Returns Mid-Draft**
   - User leaves draft (auto-picks start)
   - User returns to draft page
   - Verify auto-picks stop
   - User can pick normally

## Benefits

1. **Draft Continuity**: Draft continues even if users are unavailable
2. **No Blocking**: One absent user doesn't block the entire draft
3. **Fair Selection**: Random from top players ensures reasonable picks
4. **Clear Indication**: Visual markers show which picks were automated
5. **User Flexibility**: Users can leave and return without penalty

## Limitations

1. **Client-Side Only**: Active user tracking only works if draft page is open
2. **No Persistence**: If all users close the draft page, timer pauses
3. **No Notifications**: Users aren't notified it's their turn
4. **Simple Algorithm**: Auto-picks don't consider team strategy

For production deployment with multiple users across different computers, consider adding WebSocket support for real-time draft synchronization and server-side active user tracking.


