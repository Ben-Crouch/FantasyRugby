∏#!/usr/bin/env python3
"""
Fantasy Rugby Excel to CSV Converter

This script processes Excel match data files and converts them to CSV format,
appending the data to the existing Fantasy Rugby_converted.csv file.

Usage:
    python excel_to_csv_converter.py

The script expects:
- Excel file in Downloads folder named "Fantasy Rugby.xlsx"
- Existing Fantasy Rugby_converted.csv file in the backend directory
- Premiership squads file for player ID matching
"""

import pandas as pd
import openpyxl
from fuzzywuzzy import fuzz, process
import os
from datetime import datetime

def load_player_database():
    """Load the player database with IDs and names."""
    try:
        squad_df = pd.read_csv('premiership_official_squads_consolidated.csv')
        return squad_df
    except FileNotFoundError:
        print("Error: premiership_official_squads_consolidated.csv not found!")
        return None

def find_player_id(player_name, squad_df, threshold=80):
    """Find player ID using fuzzy matching."""
    if pd.isna(player_name) or player_name == '':
        return None
    
    # Try exact match first
    exact_match = squad_df[squad_df['Player Name'].str.lower() == player_name.lower()]
    if not exact_match.empty:
        return exact_match.iloc[0]['Player ID']
    
    # Try fuzzy matching
    choices = squad_df['Player Name'].tolist()
    result = process.extractOne(player_name, choices, scorer=fuzz.ratio)
    
    if result and result[1] >= threshold:
        matched_name = result[0]
        matched_player = squad_df[squad_df['Player Name'] == matched_name]
        if not matched_player.empty:
            return matched_player.iloc[0]['Player ID']
    
    print(f"Warning: Could not find player ID for '{player_name}'")
    return None

def extract_match_info(excel_file):
    """Extract match information from the Summary sheet."""
    try:
        summary_df = pd.read_excel(excel_file, sheet_name='Summary')
        
        # Extract date, home team, away team
        date_row = summary_df[summary_df.iloc[:, 0].str.contains('Date', na=False)]
        home_row = summary_df[summary_df.iloc[:, 0].str.contains('Home team', na=False)]
        away_row = summary_df[summary_df.iloc[:, 0].str.contains('Away team', na=False)]
        
        match_date = date_row.iloc[0, 1] if not date_row.empty else None
        home_team = home_row.iloc[0, 1] if not home_row.empty else None
        away_team = away_row.iloc[0, 1] if not away_row.empty else None
        
        return match_date, home_team, away_team
    except Exception as e:
        print(f"Error extracting match info: {e}")
        return None, None, None

def process_statistics_sheet(excel_file, sheet_name, squad_df, match_date, home_team, away_team):
    """Process a statistics sheet and return player data."""
    try:
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        players_data = []
        i = 0
        
        while i < len(df):
            # Look for team names (usually in column 0)
            if pd.notna(df.iloc[i, 0]) and str(df.iloc[i, 0]).strip():
                team_name = str(df.iloc[i, 0]).strip()
                
                # Skip if it's just a number
                if team_name.isdigit():
                    i += 1
                    continue
                
                # Process players for this team
                i += 1
                while i < len(df) and pd.notna(df.iloc[i, 0]):
                    player_name = str(df.iloc[i, 0]).strip()
                    
                    # Skip if it's a number or empty
                    if player_name.isdigit() or player_name == '':
                        i += 1
                        continue
                    
                    # Get the statistic value (next row)
                    if i + 1 < len(df) and pd.notna(df.iloc[i + 1, 0]):
                        stat_value = df.iloc[i + 1, 0]
                        try:
                            stat_value = float(stat_value)
                        except (ValueError, TypeError):
                            stat_value = 0.0
                    else:
                        stat_value = 0.0
                    
                    # Find player ID
                    player_id = find_player_id(player_name, squad_df)
                    
                    if player_id:
                        players_data.append({
                            'Player ID': player_id,
                            'Player Name': player_name,
                            'Match Date': match_date,
                            'Home Team': home_team,
                            'Away Team': away_team,
                            sheet_name: stat_value
                        })
                    
                    i += 2  # Skip the stat value row
            else:
                i += 1
        
        return players_data
    except Exception as e:
        print(f"Error processing sheet {sheet_name}: {e}")
        return []

def convert_excel_to_csv(excel_file_path, output_file_path):
    """Main function to convert Excel to CSV and append to existing file."""
    
    # Load player database
    squad_df = load_player_database()
    if squad_df is None:
        return False
    
    # Extract match information
    match_date, home_team, away_team = extract_match_info(excel_file_path)
    if not all([match_date, home_team, away_team]):
        print("Error: Could not extract match information from Summary sheet")
        return False
    
    print(f"Processing match: {home_team} vs {away_team} on {match_date}")
    
    # Get all sheet names except Summary
    wb = openpyxl.load_workbook(excel_file_path)
    sheet_names = [name for name in wb.sheetnames if name != 'Summary']
    
    # Process each statistics sheet
    all_players_data = {}
    
    for sheet_name in sheet_names:
        print(f"Processing {sheet_name}...")
        players_data = process_statistics_sheet(excel_file_path, sheet_name, squad_df, match_date, home_team, away_team)
        
        # Merge data by player
        for player_data in players_data:
            player_id = player_data['Player ID']
            if player_id not in all_players_data:
                all_players_data[player_id] = {
                    'Player ID': player_id,
                    'Player Name': player_data['Player Name'],
                    'Match Date': player_data['Match Date'],
                    'Home Team': player_data['Home Team'],
                    'Away Team': player_data['Away Team']
                }
            all_players_data[player_id][sheet_name] = player_data[sheet_name]
    
    # Convert to DataFrame
    if not all_players_data:
        print("No player data found!")
        return False
    
    new_df = pd.DataFrame(list(all_players_data.values()))
    
    # Fill missing statistics with 0
    for sheet_name in sheet_names:
        if sheet_name not in new_df.columns:
            new_df[sheet_name] = 0.0
        else:
            new_df[sheet_name] = new_df[sheet_name].fillna(0.0)
    
    # Load existing data if file exists
    if os.path.exists(output_file_path):
        existing_df = pd.read_csv(output_file_path)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df
    
    # Save the combined data
    combined_df.to_csv(output_file_path, index=False)
    
    print(f"Successfully processed {len(new_df)} players")
    print(f"Total records in file: {len(combined_df)}")
    
    return True

def main():
    """Main execution function."""
    # File paths
    excel_file = '/Users/rolandcrouch/Downloads/Fantasy Rugby.xlsx'
    output_file = 'Fantasy Rugby_converted.csv'
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"Error: Excel file not found at {excel_file}")
        return
    
    # Convert Excel to CSV
    success = convert_excel_to_csv(excel_file, output_file)
    
    if success:
        print("Conversion completed successfully!")
    else:
        print("Conversion failed!")

if __name__ == "__main__":
    main()

