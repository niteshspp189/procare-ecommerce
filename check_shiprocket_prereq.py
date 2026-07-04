import requests
import json

EMAIL = "team@webclixs.in"
PASSWORD = "Yn$Qb^U7AmlYO5Wi^WEs52l7nVOJNQp%"
BASE_URL = "https://apiv2.shiprocket.in/v1/external"

print("Authenticating...")
auth_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)

if auth_response.status_code == 200:
    data = auth_response.json()
    token = data.get("token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n--- Checking Pickup Locations / Warehouse Addresses ---")
    pickup_res = requests.get(f"{BASE_URL}/settings/company/pickup", headers=headers)
    
    if pickup_res.status_code == 200:
        pickup_data = pickup_res.json()
        locations = pickup_data.get("data", {}).get("shipping_address", [])
        if locations:
            print(f"✅ Found {len(locations)} pickup location(s):")
            for loc in locations:
                name = loc.get('pickup_location')
                city = loc.get('city')
                state = loc.get('state')
                pin = loc.get('pin_code')
                status = loc.get('status')
                print(f"   - {name} ({city}, {state} - {pin}) [Status: {status}]")
        else:
            print("❌ No pickup locations found! You need to add a warehouse address in Shiprocket.")
    else:
        print("Failed to fetch pickup locations:", pickup_res.text)

else:
    print("Authentication failed.")
