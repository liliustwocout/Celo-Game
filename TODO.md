# TODO: Add Leaderboard and Daily Rewards to Play-to-Earn Game

## Tasks
- [ ] Update App.tsx: Add leaderboard state (array of players with wins, total bets), fetch GameResult events from arena contract on mount and after play, aggregate data.
- [ ] Update App.tsx: Add claimDailyReward function using localStorage to check last claim time, allow claim if 24h passed, simulate reward by updating tokenBalance (since mint is owner-only).
- [ ] Update GameInterface.tsx: Add leaderboard display (table or list of top players), add claim daily reward button with state for claiming.
- [ ] Test the app: Run locally, connect wallet, play game, check leaderboard updates, claim rewards.
