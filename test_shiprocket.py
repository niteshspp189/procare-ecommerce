import requests
import json
import os

EMAIL = "team@webclixs.in"
PASSWORD = "Yn$Qb^U7AmlYO5Wi^WEs52l7nVOJNQp%"
BASE_URL = "https://apiv2.shiprocket.in/v1/external"

print("1. Testing Authentication...")
auth_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": EMAIL, "password": PASSWORD}
)

if auth_response.status_code == 200:
    data = auth_response.json()
    token = data.get("token")
    print(f"✅ Authentication Successful!")
    print(f"Company ID: {data.get('company_id')}")
    print(f"User: {data.get('first_name')} {data.get('last_name')}")
    
    print("\n2. Testing Dummy Order Creation (or Serviceability Check)...")
    
    # We will test the serviceability API for a dummy shipment
    # For example, sending a 1kg box from Delhi to Mumbai
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "pickup_postcode": "110020", # Delhi
        "delivery_postcode": "400001", # Mumbai
        "weight": "1",
        "cod": 0,
        "declared_value": "1000"
    }
    
    service_response = requests.get(
        f"{BASE_URL}/courier/serviceability/",
        headers=headers,
        params=payload
    )
    
    if service_response.status_code == 200:
        service_data = service_response.json()
        print("✅ Serviceability Check Successful!")
        couriers = service_data.get("data", {}).get("available_courier_companies", [])
        print(f"Found {len(couriers)} available couriers for a dummy shipment from Delhi to Mumbai.")
        if couriers:
            print(f"Example courier: {couriers[0].get('courier_name')} - Rate: ₹{couriers[0].get('rate')}")
        print("\nShiprocket API is fully functional and ready for integration!")
    else:
        print(f"❌ Serviceability Check Failed: {service_response.status_code}")
        print(service_response.text)
        
else:
    print(f"❌ Authentication Failed: {auth_response.status_code}")
    print(auth_response.text)
