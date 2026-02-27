import sqlite3

conn = sqlite3.connect('pharmacy.db')
r = conn.execute("SELECT name, prescription_required FROM medicines WHERE name LIKE '%Cyst%'").fetchall()
print("Cystinol DB result:", r)
conn.close()
