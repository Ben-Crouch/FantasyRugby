# Fantasy Rugby Data Processing System

## Overview
This system processes Excel match data and maintains a consolidated database of player statistics for fantasy rugby applications.

## Core Files

### Data Files
- `premiership_official_squads_consolidated.csv` - Master player database with IDs and fantasy positions
- `Fantasy Rugby_converted.csv` - Match statistics with player IDs (grows over time)

### Processing Scripts
- `excel_to_csv_converter.py` - Converts Excel match files to CSV format

## Adding New Match Data

### Step 1: Prepare Excel File
1. Ensure your Excel file has the following structure:
   - **Summary sheet**: Contains match date, home team, away team
   - **Statistics sheets**: Each sheet represents a different statistic (Carries, Tackles Made, Tries, etc.)
   - **Player data**: Player names in column A at rows 4, 8, 12, etc.
   - **Statistics**: Values directly below each player name

### Step 2: Convert Excel to CSV
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Run the converter
python excel_to_csv_converter.py
```

### Step 3: Verify Output
- Check that `Fantasy Rugby_converted.csv` was created/updated
- Verify player names and statistics are correct
- Ensure all players have valid data

## Data Structure

### Player Database (`premiership_official_squads_consolidated.csv`)
- **Player ID**: Unique integer identifier
- **Team**: Player's team
- **Player Name**: Full player name
- **Position**: Original rugby position
- **Fantasy Position**: Mapped position for fantasy teams
  - Wing/Fullback → Back Three
  - Flanker/No. 8 → Back Row
  - Other positions → Copied as-is

### Match Statistics (`Fantasy Rugby_converted.csv`)
- **Player ID**: Links to player database
- **Player Name**: Player name
- **Match Date**: Date of the match
- **Home Team/Away Team**: Match participants
- **Statistics**: All match statistics (Carries, Tackles Made, Tries, etc.)

## Fantasy Position Mapping

| Original Position | Fantasy Position |
|------------------|------------------|
| Wing             | Back Three       |
| Fullback         | Back Three       |
| Flanker          | Back Row         |
| No. 8            | Back Row         |
| Other positions  | Copied as-is     |

## Requirements

### Python Dependencies
- pandas
- openpyxl
- fuzzywuzzy
- python-levenshtein

### Installation
```bash
pip install pandas openpyxl fuzzywuzzy python-levenshtein
```

## Usage Examples

### Convert New Match Data
```bash
# Place your Excel file in the Downloads folder
# Update the file path in excel_to_csv_converter.py if needed
python excel_to_csv_converter.py
```

### Check Data Quality
```python
import pandas as pd

# Load the data
squad_df = pd.read_csv('premiership_official_squads_consolidated.csv')
fantasy_df = pd.read_csv('Fantasy Rugby_converted.csv')

# Check player counts
print(f"Squad players: {len(squad_df)}")
print(f"Fantasy players: {len(fantasy_df)}")

# Check for missing data
print(f"Missing player IDs: {fantasy_df['Player ID'].isna().sum()}")
```

## Troubleshooting

### Common Issues
1. **Excel file not found**: Check file path in converter
2. **Player names not matching**: Verify name formatting in Excel
3. **Missing statistics**: Check Excel sheet structure
4. **Data type errors**: Ensure numeric values are properly formatted

### Data Validation
- All players should have Player IDs
- Match dates should be consistent
- Statistics should be numeric values
- No missing or null values in critical fields

## File Maintenance

### Regular Tasks
1. **Backup data files** before major updates
2. **Validate new data** after conversion
3. **Check for duplicate entries**
4. **Update player database** when new players join teams

### Data Quality Checks
- Player ID uniqueness
- Match date consistency
- Team name standardization
- Position mapping accuracy

## Support

For issues with data processing or file structure, check:
1. Excel file format matches requirements
2. All required sheets are present
3. Player names are correctly formatted
4. Statistics are in the expected locations

## Version History

- **v1.0**: Initial setup with player database and match statistics
- **v1.1**: Added fantasy position mapping
- **v1.2**: Improved player matching and data validation
