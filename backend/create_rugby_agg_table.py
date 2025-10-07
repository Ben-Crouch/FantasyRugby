#!/usr/bin/env python3
"""
Create and populate rugby match statistics aggregate table
This script creates a comprehensive aggregate table from rugby_match_statistics
"""

from fantasy.databricks_rest_client import DatabricksRestClient

def create_rugby_agg_table():
    """Create and populate rugby match statistics aggregate table"""
    client = DatabricksRestClient()
    
    print("🏉 Creating Rugby Match Statistics Aggregate Table...")
    
    # Create the aggregate table
    create_sql = """
    CREATE TABLE IF NOT EXISTS default.rugby_match_statistics_agg (
        player_id BIGINT,
        player_name STRING,
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
        last_updated TIMESTAMP
    ) USING DELTA
    """
    
    # Populate the aggregate table with comprehensive statistics
    # Note: We calculate minutes_played by dividing tackles_made by tackles_per_minute
    # Then we sum tackles_made and sum minutes_played to get overall tackles_per_minute
    populate_sql = """
    INSERT INTO default.rugby_match_statistics_agg
    SELECT 
        `Player ID` as player_id,
        `Player Name` as player_name,
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
        CURRENT_TIMESTAMP as last_updated
    FROM default.rugby_match_statistics
    GROUP BY `Player ID`, `Player Name`
    """
    
    # Check if table exists and get row count
    check_sql = """
    SELECT COUNT(*) as row_count 
    FROM default.rugby_match_statistics_agg
    """
    
    try:
        print("📊 Creating aggregate table structure...")
        result1 = client.execute_sql(create_sql)
        print(f"✅ Table creation result: {result1}")
        
        print("📈 Populating aggregate table with player statistics...")
        result2 = client.execute_sql(populate_sql)
        print(f"✅ Population result: {result2}")
        
        print("🔍 Checking final row count...")
        result3 = client.execute_sql(check_sql)
        if result3 and 'result' in result3 and result3['result'].get('data_array'):
            row_count = result3['result']['data_array'][0][0]
            print(f"✅ Aggregate table created successfully with {row_count} player records!")
        else:
            print("✅ Aggregate table created successfully!")
        
        print("\n🎯 Aggregate table includes:")
        print("   • Total statistics (sums across all matches)")
        print("   • Average statistics (per match averages)")
        print("   • Player identification (ID, name, team)")
        print("   • Timestamp for tracking updates")
        
    except Exception as e:
        print(f"❌ Error creating rugby aggregate table: {str(e)}")
        raise

def update_rugby_agg_table():
    """Update the aggregate table with new data (full refresh)"""
    client = DatabricksRestClient()
    
    print("🔄 Updating Rugby Match Statistics Aggregate Table...")
    
    # Truncate and repopulate (full refresh)
    truncate_sql = "TRUNCATE TABLE default.rugby_match_statistics_agg"
    
    populate_sql = """
    INSERT INTO default.rugby_match_statistics_agg
    SELECT 
        `Player ID` as player_id,
        `Player Name` as player_name,
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
        CURRENT_TIMESTAMP as last_updated
    FROM default.rugby_match_statistics
    GROUP BY `Player ID`, `Player Name`
    """
    
    try:
        print("🗑️ Clearing existing data...")
        result1 = client.execute_sql(truncate_sql)
        print(f"✅ Truncate result: {result1}")
        
        print("📈 Repopulating with latest data...")
        result2 = client.execute_sql(populate_sql)
        print(f"✅ Update result: {result2}")
        
        print("✅ Aggregate table updated successfully!")
        
    except Exception as e:
        print(f"❌ Error updating rugby aggregate table: {str(e)}")
        raise

def show_sample_data():
    """Show sample data from the aggregate table"""
    client = DatabricksRestClient()
    
    print("📊 Sample data from rugby_match_statistics_agg:")
    
    sample_sql = """
    SELECT 
        player_name,
        total_matches,
        total_minutes_played,
        total_tries,
        total_tackles_made,
        avg_tackles_per_minute,
        avg_tries_per_match,
        avg_tackles_per_match,
        last_updated
    FROM default.rugby_match_statistics_agg
    ORDER BY total_tries DESC
    LIMIT 5
    """
    
    try:
        result = client.execute_sql(sample_sql)
        if result and 'result' in result and result['result'].get('data_array'):
            print("\n🏆 Top 5 players by total tries:")
            print("Player Name | Matches | Minutes | Tries | Tackles | Tackles/Min | Avg Tries/Match | Avg Tackles/Match")
            print("-" * 110)
            for row in result['result']['data_array']:
                minutes = float(row[2]) if row[2] is not None else 0
                tries = float(row[3]) if row[3] is not None else 0
                tackles = float(row[4]) if row[4] is not None else 0
                tackles_per_min = float(row[5]) if row[5] is not None else 0
                avg_tries = float(row[6]) if row[6] is not None else 0
                avg_tackles = float(row[7]) if row[7] is not None else 0
                print(f"{row[0]:<15} | {row[1]:<7} | {minutes:>7.1f} | {tries:>5.0f} | {tackles:>7.0f} | {tackles_per_min:>10.3f} | {avg_tries:>15.2f} | {avg_tackles}")
        else:
            print("No data found in aggregate table")
            
    except Exception as e:
        print(f"❌ Error retrieving sample data: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "update":
        update_rugby_agg_table()
    elif len(sys.argv) > 1 and sys.argv[1] == "sample":
        show_sample_data()
    else:
        create_rugby_agg_table()
        show_sample_data()
