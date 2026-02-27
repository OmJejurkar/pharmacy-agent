import requests

base_url = "http://localhost:8000/agent/chat"
user_id = "NEW_USER_004"

def chat(text, rx=False):
    resp = requests.post(base_url, json={"text": text, "user_id": user_id, "prescription_verified": rx}).json()
    print(f"U: {text} | Rx: {rx}")
    print(f"B ({resp.get('status')}): {resp.get('result')}")
    print()

print("--- NEW USER FLOW ---")
# 1. Ask for Ramipril
chat("I want Ramipril - 1 A Pharma® 10 mg Tabletten", False)
# 2. Upload Rx
chat("I want Ramipril - 1 A Pharma® 10 mg Tabletten", True)
# 3. Say yes
chat("yes", True)

# Admin approves
print("--- ADMIN APPROVES ---")
apps = requests.get("http://localhost:8000/admin/approvals").json()
for a in apps:
    if a['user_id'] == user_id:
        requests.post(f"http://localhost:8000/admin/approvals/{a['id']}", json={"status": "approved"})

# 4. Ask for Ramipril again
chat("I want Ramipril - 1 A Pharma® 10 mg Tabletten", False)
# 5. Say Yes
chat("yes", False)
