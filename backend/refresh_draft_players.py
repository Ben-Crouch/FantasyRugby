#!/usr/bin/env python3
"""
Refresh script for draft players materialized table
Run this whenever rugby_match_statistics_agg is updated
"""

from fantasy.databricks_rest_client import DatabricksRestClient

def refresh_draft_players_table():
    """Refresh the materialized draft players table with latest fantasy points data"""
    client = DatabricksRestClient()
    
    print("🔄 Refreshing draft players materialized table...")
    
    # Drop and recreate the materialized table
    drop_sql = "DROP TABLE IF EXISTS default.draft_players_optimized"
    client.execute_sql(drop_sql)
    print("✅ Dropped existing table")
    
    # Create materialized table with latest data - using ROW_NUMBER to deduplicate
    create_sql = """
    CREATE TABLE default.draft_players_optimized AS
    SELECT 
        id,
        team,
        name,
        position,
        fantasy_position,
        tournament_id,
        fantasy_points_per_game,
        fantasy_points_per_minute,
        total_fantasy_points,
        matches_played,
        total_tries,
        total_tackles_made,
        total_metres_carried,
        avg_tries_per_match,
        avg_tackles_per_match,
        last_updated
    FROM (
        SELECT 
            rp.player_id as id,
            rp.team,
            rp.player_name as name,
            rp.position,
            rp.fantasy_position,
            rp.tournament_id,
            ROUND(COALESCE(agg.fantasy_points_per_game, 0), 1) as fantasy_points_per_game,
            ROUND(COALESCE(agg.fantasy_points_per_minute, 0), 2) as fantasy_points_per_minute,
            ROUND(COALESCE(agg.total_fantasy_points, 0), 1) as total_fantasy_points,
            COALESCE(agg.matches_played, 0) as matches_played,
            ROUND(COALESCE(agg.total_tries, 0), 1) as total_tries,
            ROUND(COALESCE(agg.total_tackles_made, 0), 1) as total_tackles_made,
            ROUND(COALESCE(agg.total_metres_carried, 0), 1) as total_metres_carried,
            ROUND(COALESCE(agg.avg_tries_per_match, 0), 2) as avg_tries_per_match,
            ROUND(COALESCE(agg.avg_tackles_per_match, 0), 2) as avg_tackles_per_match,
            CURRENT_TIMESTAMP as last_updated,
            ROW_NUMBER() OVER (PARTITION BY rp.player_id ORDER BY rp.player_id) as rn
        FROM default.rugby_players_25_26 rp
        LEFT JOIN default.rugby_match_statistics_agg agg 
            ON rp.player_id = agg.player_id
    ) ranked
    WHERE rn = 1
    """
    
    result = client.execute_sql(create_sql)
    print(f"✅ Recreated materialized table: {result}")
    
    # Verify the refresh
    count_sql = "SELECT COUNT(*) FROM default.draft_players_optimized"
    result2 = client.execute_sql(count_sql)
    if result2 and 'result' in result2 and result2['result'].get('data_array'):
        row_count = result2['result']['data_array'][0][0]
        print(f"✅ Materialized table refreshed with {row_count} players!")
    
    # Show sample of updated data
    sample_sql = """
    SELECT 
        name,
        fantasy_position,
        fantasy_points_per_game,
        fantasy_points_per_minute,
        total_fantasy_points,
        last_updated
    FROM default.draft_players_optimized
    WHERE fantasy_points_per_game > 0
    ORDER BY fantasy_points_per_game DESC
    LIMIT 5
    """
    
    result3 = client.execute_sql(sample_sql)
    if result3 and 'result' in result3 and result3['result'].get('data_array'):
        print("\n📊 Sample of refreshed data:")
        for row in result3['result']['data_array']:
            fp_per_game = float(row[2]) if row[2] is not None else 0.0
            fp_per_minute = float(row[3]) if row[3] is not None else 0.0
            total_fp = float(row[4]) if row[4] is not None else 0.0
            print(f"  {row[0]} ({row[1]}): {fp_per_game:.1f} FP/Game, {fp_per_minute:.1f} FP/Min, {total_fp:.1f} Total")
    
    print("\n🎯 Draft players table refresh completed!")
    print("📝 Next steps:")
    print("   • API will now return updated fantasy points data")
    print("   • Draft will show players sorted by fantasy points per game")
    print("   • All fantasy point values are rounded to 1 decimal place")

if __name__ == "__main__":
    refresh_draft_players_table()
