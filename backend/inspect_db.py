import sqlite3

conn = sqlite3.connect('pharmacy.db')
# List all tables
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])

# Check orders-like tables
for table_name, in tables:
    if 'order' in table_name.lower():
        cols = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        print(f"\nTable '{table_name}' columns:", [c[1] for c in cols])
        count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        print(f"  Row count: {count}")
        if count > 0:
            sample = conn.execute(f"SELECT * FROM {table_name} LIMIT 3").fetchall()
            for row in sample:
                print("  Sample:", dict(row))

conn.close()
