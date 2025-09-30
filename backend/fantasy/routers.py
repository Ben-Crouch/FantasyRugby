class DatabricksRouter:
    """
    Database router to direct models to the appropriate database.
    User-created league models go to Databricks, Django auth models stay local.
    """
    
    # Models that should use Databricks
    databricks_models = {
        'fantasy.UserCreatedLeague',
        'fantasy.LeagueTeam', 
        'fantasy.LeagueTeamPlayer',
        'fantasy.FantasyTeam',
        'fantasy.AuthUser'
    }
    
    def db_for_read(self, model, **hints):
        """Point reads to the appropriate database."""
        if model._meta.label in self.databricks_models:
            return 'databricks'
        return None
    
    def db_for_write(self, model, **hints):
        """Point writes to the appropriate database."""
        if model._meta.label in self.databricks_models:
            return 'databricks'
        return None
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations between models in the same database."""
        db_set = {'default', 'databricks'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that certain models don't get migrated to the wrong database."""
        if db == 'databricks':
            # Only allow our custom models to be migrated to Databricks
            return model_name in self.databricks_models
        elif db == 'default':
            # Django's built-in models should only go to default
            return model_name not in self.databricks_models
        return None
