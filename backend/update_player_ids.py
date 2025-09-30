#!/usr/bin/env python3
"""
Update Player IDs in Fantasy Rugby_converted.csv using Rugby Player ID Lookup.xlsx
"""

import pandas as pd
import numpy as np

def update_player_ids():
    """Update Player IDs in the fantasy CSV using the lookup file"""
    
    # Read the lookup file
    print("Reading lookup file...")
    lookup_df = pd.read_excel('/Users/rolandcrouch/Downloads/Rugby Player ID Lookup.xlsx')
    
    # Rename columns for clarity
    lookup_df.columns = ['Player Name', 'Player ID']
    
    # Remove any rows with NaN values
    lookup_df = lookup_df.dropna()
    
    print(f"Lookup file: {len(lookup_df)} player mappings")
    print("Sample lookup data:")
    print(lookup_df.head(10))
    
    # Read the fantasy CSV
    print("\nReading Fantasy Rugby_converted.csv...")
    fantasy_df = pd.read_csv('/Users/rolandcrouch/Documents/Rugby Fantasy/backend/Fantasy Rugby_converted.csv')
    
    print(f"Fantasy CSV: {len(fantasy_df)} rows")
    print(f"Current Player ID distribution:")
    print(fantasy_df['Player ID'].value_counts().sort_index())
    
    # Create a mapping dictionary from the lookup
    player_id_mapping = dict(zip(lookup_df['Player Name'], lookup_df['Player ID']))
    
    print(f"\nPlayer ID mapping created for {len(player_id_mapping)} players")
    
    # Update Player IDs where they are currently 0
    updated_count = 0
    for idx, row in fantasy_df.iterrows():
        if row['Player ID'] == 0 and row['Player Name'] in player_id_mapping:
            old_id = row['Player ID']
            new_id = player_id_mapping[row['Player Name']]
            fantasy_df.at[idx, 'Player ID'] = new_id
            updated_count += 1
            print(f"Updated {row['Player Name']}: {old_id} -> {new_id}")
    
    print(f"\nUpdated {updated_count} player IDs")
    
    # Show updated distribution
    print(f"\nUpdated Player ID distribution:")
    print(fantasy_df['Player ID'].value_counts().sort_index())
    
    # Show players that still have ID = 0
    remaining_zero_ids = fantasy_df[fantasy_df['Player ID'] == 0]['Player Name'].unique()
    print(f"\nPlayers still with ID = 0 ({len(remaining_zero_ids)}):")
    for player in remaining_zero_ids:
        print(f"  - {player}")
    
    # Save the updated CSV
    output_path = '/Users/rolandcrouch/Documents/Rugby Fantasy/backend/Fantasy Rugby_converted.csv'
    fantasy_df.to_csv(output_path, index=False)
    print(f"\nUpdated CSV saved to: {output_path}")
    
    return fantasy_df

if __name__ == "__main__":
    updated_df = update_player_ids()
