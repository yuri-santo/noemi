import os
import psycopg2

password = "Martiniano.165812"
conn_str = f"postgresql://postgres:{password}@db.izphobguvtfjqzrsbkva.supabase.co:5432/postgres"

# ler convidados.txt
with open("convidados.txt", "r", encoding="utf-8") as f:
    guests = [line.strip() for line in f if line.strip()]

try:
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            # deletar tudo antes para nao duplicar
            cur.execute("DELETE FROM public.allowed_guests")
            for guest in guests:
                cur.execute("INSERT INTO public.allowed_guests (name) VALUES (%s)", (guest,))
            conn.commit()
    print(f"Migrated {len(guests)} guests to allowed_guests successfully.")
except Exception as e:
    print(f"Error: {e}")
