import psycopg2

DB_CONFIG = {
    'host'    : 'localhost',
    'port'    : 5432,
    'dbname'  : 'fss_db',
    'user'    : 'postgres',
    'password': '123456',
}

def check_table(table_name):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(f"SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = '{table_name}'")
        cols = cur.fetchall()
        print(f"Table: {table_name}")
        for col in cols:
            print(f" - {col}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error checking {table_name}:", e)

check_table('orders')
check_table('order_items')
