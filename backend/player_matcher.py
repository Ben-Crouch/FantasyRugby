#!/usr/bin/env python3
"""
Match players from Fantasy Rugby_converted.csv to premiership_official_squads_consolidated.csv
"""

import pandas as pd
from fuzzywuzzy import fuzz, process
import re

def clean_player_name(name):
    """Clean player name for better matching"""
    if pd.isna(name):
        return ""
    
    # Convert to string and strip whitespace
    name = str(name).strip()
    
    # Remove common suffixes and prefixes
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|IV|V)$', '', name)
    name = re.sub(r'^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\s+', '', name)
    
    # Remove extra spaces
    name = re.sub(r'\s+', ' ', name)
    
    return name

def match_players():
    """Match players between the two CSV files"""
    
    # Read the files
    print("Reading CSV files...")
    fantasy_df = pd.read_csv('/Users/rolandcrouch/Documents/Rugby Fantasy/backend/Fantasy Rugby_converted.csv')
    squads_df = pd.read_csv('/Users/rolandcrouch/Documents/Rugby Fantasy/backend/premiership_official_squads_consolidated.csv')
    
    print(f"Fantasy Rugby data: {len(fantasy_df)} rows")
    print(f"Squad data: {len(squads_df)} rows")
    
    # Get unique player names from fantasy data
    fantasy_players = fantasy_df['Player Name'].unique()
    print(f"Unique fantasy players: {len(fantasy_players)}")
    
    # Get unique player names from squad data
    squad_players = squads_df['Player Name'].unique()
    print(f"Unique squad players: {len(squad_players)}")
    
    # Clean names for better matching
    fantasy_players_clean = [clean_player_name(name) for name in fantasy_players]
    squad_players_clean = [clean_player_name(name) for name in squad_players]
    
    # Create mapping dictionaries
    fantasy_clean_to_original = dict(zip(fantasy_players_clean, fantasy_players))
    squad_clean_to_original = dict(zip(squad_players_clean, squad_players))
    
    # Match players
    print("\nMatching players...")
    matches = []
    unmatched_fantasy = []
    
    for fantasy_player_clean in fantasy_players_clean:
        if not fantasy_player_clean:  # Skip empty names
            continue
            
        # Find best match
        best_match = process.extractOne(
            fantasy_player_clean, 
            squad_players_clean, 
            scorer=fuzz.ratio
        )
        
        if best_match and best_match[1] >= 80:  # 80% similarity threshold
            fantasy_original = fantasy_clean_to_original[fantasy_player_clean]
            squad_original = squad_clean_to_original[best_match[0]]
            
            matches.append({
                'fantasy_player': fantasy_original,
                'squad_player': squad_original,
                'similarity': best_match[1],
                'fantasy_team': fantasy_df[fantasy_df['Player Name'] == fantasy_original]['Home Team'].iloc[0] if len(fantasy_df[fantasy_df['Player Name'] == fantasy_original]) > 0 else 'Unknown',
                'squad_team': squads_df[squads_df['Player Name'] == squad_original]['Team'].iloc[0] if len(squads_df[squads_df['Player Name'] == squad_original]) > 0 else 'Unknown'
            })
        else:
            unmatched_fantasy.append(fantasy_clean_to_original[fantasy_player_clean])
    
    # Convert to DataFrame for easier viewing
    matches_df = pd.DataFrame(matches)
    
    print(f"\n=== MATCHING RESULTS ===")
    print(f"Total fantasy players: {len(fantasy_players)}")
    print(f"Successfully matched: {len(matches)}")
    print(f"Unmatched: {len(unmatched_fantasy)}")
    print(f"Match rate: {len(matches)/len(fantasy_players)*100:.1f}%")
    
    if len(matches) > 0:
        print(f"\n=== TOP 20 MATCHES ===")
        top_matches = matches_df.nlargest(20, 'similarity')
        for _, match in top_matches.iterrows():
            print(f"{match['fantasy_player']} -> {match['squad_player']} ({match['similarity']:.0f}%) [{match['fantasy_team']} -> {match['squad_team']}]")
    
    if len(unmatched_fantasy) > 0:
        print(f"\n=== UNMATCHED PLAYERS (first 20) ===")
        for player in unmatched_fantasy[:20]:
            print(f"- {player}")
    
    # Check for potential team mismatches
    if len(matches) > 0:
        print(f"\n=== POTENTIAL TEAM MISMATCHES ===")
        team_mismatches = matches_df[matches_df['fantasy_team'] != matches_df['squad_team']]
        if len(team_mismatches) > 0:
            for _, mismatch in team_mismatches.head(10).iterrows():
                print(f"{mismatch['fantasy_player']}: {mismatch['fantasy_team']} -> {mismatch['squad_team']} ({mismatch['similarity']:.0f}%)")
        else:
            print("No team mismatches found!")
    
    return matches_df, unmatched_fantasy

if __name__ == "__main__":
    matches_df, unmatched = match_players()
