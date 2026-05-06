from dotenv import load_dotenv
import os, requests, psycopg2

load_dotenv()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# cmmau66jb00014cjy4o18fhbu の最新3件以外を取得
cur.execute("""
    SELECT id, "audioPath", "comparisonResultPath"
    FROM "Performance"
    WHERE "scoreId" = 'cmmau66jb00014cjy4o18fhbu'
    ORDER BY "uploadedAt" DESC
    OFFSET 3
""")
old_rows = cur.fetchall()

print(f"Deleting {len(old_rows)} old performances...")

headers = {
    "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
    "apikey": os.getenv("SUPABASE_SERVICE_ROLE_KEY")
}
base = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/performances"

for row in old_rows:
    perf_id, audio_path, comp_path = row
    
    # Storage のファイル削除
    paths_to_delete = []
    if audio_path:
        paths_to_delete.append(audio_path)
    if comp_path:
        paths_to_delete.append(comp_path)
    
    if paths_to_delete:
        del_res = requests.delete(base, headers={**headers, "Content-Type": "application/json"}, json={"prefixes": paths_to_delete})
        print(f"  Storage delete: {del_res.status_code}")
    
    # DB から削除
    cur.execute('DELETE FROM "Performance" WHERE id = %s', (perf_id,))
    print(f"  Deleted: {perf_id}")

conn.commit()
cur.close()
conn.close()

print(f"\nDone. Deleted {len(old_rows)} old test performances.")