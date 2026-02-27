import requests
import json

out = {}
user_id = "TEST_USER_99"
base_url = "http://localhost:8000/agent/chat"

payload = {
    "text": "I need Ramipril - 1 A Pharma® 10 mg Tabletten",
    "user_id": user_id,
    "prescription_verified": False
}
out["test1_no_rx"] = requests.post(base_url, json=payload).json()

payload["prescription_verified"] = True
out["test2_upload_rx"] = requests.post(base_url, json=payload).json()

payload["text"] = "Yes"
out["test3_yes"] = requests.post(base_url, json=payload).json()

out["test4_admin"] = requests.get("http://localhost:8000/admin/approvals").json()
out["test5_orders"] = requests.get(f"http://localhost:8000/orders/{user_id}").json()

with open("test_bug_out.json", "w") as f:
    json.dump(out, f, indent=2)
