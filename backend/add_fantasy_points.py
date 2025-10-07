#!/usr/bin/env python3
"""
Add fantasy points calculation to rugby match statistics aggregate table
This script adds total_fantasy_points and individual_fantasy_points columns
"""

from fantasy.databricks_rest_client import DatabricksRestClient

def add_fantasy_points_columns():
    """Add fantasy points columns to the aggregate table"""
    client = DatabricksRestClient()
    
    print("🏉 Adding Fantasy Points to Rugby Aggregate Table...")
    
    # First, let's add the new columns to the existing table
    # We'll add individual fantasy points for each stat and total fantasy points
    
    # Map aggregate table columns to points allocation features
    column_mapping = {
        'total_carries': 'Carries',
        'total_line_breaks': 'Line Break', 
        'total_tackles_made': 'Tackles Made',
        'total_tackles_missed': 'Tackles Missed',
        'total_dominant_tackles': 'Dominant Tackles',
        'total_turnovers_won': 'Turnovers Won',
        'total_lineouts_won': 'Lineouts Won',
        'total_yellow_cards': 'Yellow Cards',
        'total_penalties_conceded': 'Penalties Conceded',
        'total_red_cards': 'Red Cards',
        'total_passes_made': 'Passes Made',
        'total_metres_carried': 'Metres Carried',
        'total_offloads': 'Offloads',
        'total_defenders_beaten': 'Defenders Beaten',
        'total_try_assists': 'Try Assists',
        'total_tries': 'Tries',
        'total_turnovers_lost': 'Turnovers Lost'
    }
    
    # Get points allocation data
    print("📊 Fetching points allocation data...")
    points_result = client.execute_sql('SELECT Feature, Points FROM default.rugby_points_allocation')
    points_dict = {}
    
    if points_result and 'result' in points_result and points_result['result'].get('data_array'):
        for row in points_result['result']['data_array']:
            points_dict[row[0]] = float(row[1])
        print(f"✅ Loaded {len(points_dict)} point allocations")
    else:
        print("❌ Could not load points allocation data")
        return
    
    # Create the new table with fantasy points columns
    print("🏗️ Creating new table with fantasy points columns...")
    
    # Drop existing table
    drop_sql = "DROP TABLE IF EXISTS default.rugby_match_statistics_agg"
    client.execute_sql(drop_sql)
    
    # Create new table with fantasy points columns
    create_sql = """
    CREATE TABLE default.rugby_match_statistics_agg (
        player_id BIGINT,
        player_name STRING,
        matches_played INT,
        total_matches INT,
        total_minutes_played DOUBLE,
        total_carries DOUBLE,
        total_line_breaks DOUBLE,
        total_tackles_made DOUBLE,
        total_tackles_missed DOUBLE,
        total_dominant_tackles DOUBLE,
        total_turnovers_won DOUBLE,
        total_ruck_turnovers DOUBLE,
        total_lineouts_won DOUBLE,
        total_yellow_cards DOUBLE,
        total_penalties_conceded DOUBLE,
        total_red_cards DOUBLE,
        total_passes_made DOUBLE,
        total_metres_carried DOUBLE,
        total_offloads DOUBLE,
        total_defenders_beaten DOUBLE,
        total_try_assists DOUBLE,
        total_tries DOUBLE,
        total_turnovers_lost DOUBLE,
        avg_tackles_per_minute DOUBLE,
        avg_carries_per_match DOUBLE,
        avg_metres_per_match DOUBLE,
        avg_tries_per_match DOUBLE,
        avg_tackles_per_match DOUBLE,
        total_fantasy_points DOUBLE,
        fantasy_points_per_game DOUBLE,
        fantasy_points_per_minute DOUBLE,
        last_updated TIMESTAMP
    ) USING DELTA
    """
    
    result = client.execute_sql(create_sql)
    print(f"✅ Table creation result: {result}")
    
    # Build the fantasy points calculation SQL
    print("🧮 Building fantasy points calculation...")
    
    # Create the CASE statements for each stat that has points allocation
    fantasy_points_calc = []
    for agg_column, points_feature in column_mapping.items():
        if points_feature in points_dict:
            points_value = points_dict[points_feature]
            fantasy_points_calc.append(f"({agg_column} * {points_value})")
            print(f"   {agg_column} ({points_feature}) = {points_value} points")
    
    # Join all the calculations with +
    total_fantasy_points_sql = " + ".join(fantasy_points_calc)
    
    # Populate the table with fantasy points calculation
    populate_sql = f"""
    INSERT INTO default.rugby_match_statistics_agg
    SELECT 
        `Player ID` as player_id,
        `Player Name` as player_name,
        COUNT(*) as matches_played,
        COUNT(*) as total_matches,
        -- Calculate total minutes played by summing individual match minutes
        SUM(CASE WHEN `Total Tackles per Minute` > 0 THEN `Tackles Made` / `Total Tackles per Minute` ELSE 0 END) as total_minutes_played,
        SUM(Carries) as total_carries,
        SUM(`Line Breaks`) as total_line_breaks,
        SUM(`Tackles Made`) as total_tackles_made,
        SUM(`Tackles Missed`) as total_tackles_missed,
        SUM(`Dominant Tackles`) as total_dominant_tackles,
        SUM(`Turnovers Won`) as total_turnovers_won,
        SUM(`Ruck Turnovers`) as total_ruck_turnovers,
        SUM(`Lineouts Won`) as total_lineouts_won,
        SUM(`Yellow Cards`) as total_yellow_cards,
        SUM(`Penalties Conceded`) as total_penalties_conceded,
        SUM(`Red Cards`) as total_red_cards,
        SUM(`Passes Made`) as total_passes_made,
        SUM(`Metres Carried`) as total_metres_carried,
        SUM(Offloads) as total_offloads,
        SUM(`Defenders Beaten`) as total_defenders_beaten,
        SUM(`Try Assists`) as total_try_assists,
        SUM(Tries) as total_tries,
        SUM(`Turnovers Lost`) as total_turnovers_lost,
        -- Calculate overall tackles per minute: total_tackles_made / total_minutes_played
        CASE 
            WHEN SUM(CASE WHEN `Total Tackles per Minute` > 0 THEN `Tackles Made` / `Total Tackles per Minute` ELSE 0 END) > 0 
            THEN SUM(`Tackles Made`) / SUM(CASE WHEN `Total Tackles per Minute` > 0 THEN `Tackles Made` / `Total Tackles per Minute` ELSE 0 END)
            ELSE 0 
        END as avg_tackles_per_minute,
        AVG(Carries) as avg_carries_per_match,
        AVG(`Metres Carried`) as avg_metres_per_match,
        AVG(Tries) as avg_tries_per_match,
        AVG(`Tackles Made`) as avg_tackles_per_match,
        -- Calculate total fantasy points
        ({total_fantasy_points_sql}) as total_fantasy_points,
        -- Calculate fantasy points per game (total_fantasy_points / matches_played)
        CASE 
            WHEN COUNT(*) > 0 THEN ({total_fantasy_points_sql}) / COUNT(*)
            ELSE 0 
        END as fantasy_points_per_game,
        -- Calculate fantasy points per minute (total_fantasy_points / total_minutes_played)
        CASE 
            WHEN SUM(CASE WHEN `Total Tackles per Minute` > 0 THEN `Tackles Made` / `Total Tackles per Minute` ELSE 0 END) > 0 
            THEN ({total_fantasy_points_sql}) / SUM(CASE WHEN `Total Tackles per Minute` > 0 THEN `Tackles Made` / `Total Tackles per Minute` ELSE 0 END)
            ELSE 0 
        END as fantasy_points_per_minute,
        CURRENT_TIMESTAMP as last_updated
    FROM default.rugby_match_statistics
    GROUP BY `Player ID`, `Player Name`
    """
    
    print("📈 Populating table with fantasy points...")
    result2 = client.execute_sql(populate_sql)
    print(f"✅ Population result: {result2}")
    
    # Check final row count
    check_sql = "SELECT COUNT(*) as row_count FROM default.rugby_match_statistics_agg"
    result3 = client.execute_sql(check_sql)
    if result3 and 'result' in result3 and result3['result'].get('data_array'):
        row_count = result3['result']['data_array'][0][0]
        print(f"✅ Aggregate table created successfully with {row_count} player records!")
    
    print("\n🎯 Fantasy points calculation includes:")
    for agg_column, points_feature in column_mapping.items():
        if points_feature in points_dict:
            points_value = points_dict[points_feature]
            print(f"   • {agg_column} ({points_feature}): {points_value} points")

def show_fantasy_points_sample():
    """Show sample data with fantasy points"""
    client = DatabricksRestClient()
    
    print("🏆 Top 10 players by fantasy points:")
    result = client.execute_sql("""
    SELECT 
        player_name,
        matches_played,
        total_tries,
        total_tackles_made,
        total_metres_carried,
        total_fantasy_points,
        fantasy_points_per_game,
        fantasy_points_per_minute,
        last_updated
    FROM default.rugby_match_statistics_agg
    ORDER BY total_fantasy_points DESC
    LIMIT 10
    """)
    
    if result and 'result' in result and result['result'].get('data_array'):
        print("Player Name | Matches | Tries | Tackles | Metres | Total FP | FP/Game | FP/Min")
        print("-" * 95)
        for i, row in enumerate(result['result']['data_array'], 1):
            tries = float(row[2]) if row[2] is not None else 0
            tackles = float(row[3]) if row[3] is not None else 0
            metres = float(row[4]) if row[4] is not None else 0
            fantasy_points = float(row[5]) if row[5] is not None else 0
            fp_per_game = float(row[6]) if row[6] is not None else 0
            fp_per_minute = float(row[7]) if row[7] is not None else 0
            print(f"{row[0]:<25} | {row[1]:<7} | {tries:>5.0f} | {tackles:>7.0f} | {metres:>6.0f} | {fantasy_points:>8.1f} | {fp_per_game:>7.1f} | {fp_per_minute:>6.2f}")
    else:
        print("No data found in aggregate table")

if __name__ == "__main__":
    add_fantasy_points_columns()
    show_fantasy_points_sample()
