(async () => {
  const { Pool } = (await import('pg')).default;

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: '123456'
});

async function createDatabase() {
    try {
        await pool.query('CREATE DATABASE subscriptiontracker');
        console.log('Database created successfully');
    } catch (error) {
        if (error.code === '42P04') {
            console.log('Database already exists');
        } else {
            console.error('Error creating database:', error);
        }
    } finally {
        await pool.end();
    }
}

await createDatabase();
})();
