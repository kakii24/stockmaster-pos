use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    let schema_sql = include_str!("../../migrations/001_initial_schema.sql");
    conn.execute_batch(schema_sql)?;
    Ok(())
}
