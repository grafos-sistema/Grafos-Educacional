import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

# Replace these with valid login credentials for a user associated with at least one institution
VALID_EMAIL = "admin@example.com"
VALID_PASSWORD = "StrongP@ssw0rd!"


def test_post_auth_switch_institution_with_valid_institution_id():
    session = requests.Session()
    try:
        # Step 1: Login to get Bearer token and user info
        login_payload = {
            "email": VALID_EMAIL,
            "password": VALID_PASSWORD
        }
        login_resp = session.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken") or login_data.get("access_token") or login_data.get("token")
        assert access_token, "No access token returned on login"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Step 2: Get current authenticated user profile to find linked institution IDs
        me_resp = session.get(f"{BASE_URL}/auth/me", headers=headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Get auth/me failed: {me_resp.status_code} {me_resp.text}"
        me_data = me_resp.json()

        # The user object should contain institution information; typical property could be 'institutions' or 'institutionIds'
        # We try to find a linked institutionId to test with
        institution_id = None
        # Possible fields to explore
        if "institutions" in me_data and isinstance(me_data["institutions"], list) and me_data["institutions"]:
            institution = me_data["institutions"][0]
            if isinstance(institution, dict) and "id" in institution:
                institution_id = institution["id"]
            elif isinstance(institution, str):
                institution_id = institution
        elif "institutionId" in me_data and isinstance(me_data["institutionId"], str):
            institution_id = me_data["institutionId"]
        elif "activeInstitution" in me_data and me_data["activeInstitution"] and "id" in me_data["activeInstitution"]:
            institution_id = me_data["activeInstitution"]["id"]

        assert institution_id, "No linked institutionId found for the user to test switching"

        # Step 3: POST /auth/switch-institution with valid institutionId
        switch_payload = {
            "institutionId": institution_id
        }
        switch_resp = session.post(f"{BASE_URL}/auth/switch-institution", headers=headers, json=switch_payload, timeout=TIMEOUT)
        assert switch_resp.status_code == 200, f"Switch institution failed: {switch_resp.status_code} {switch_resp.text}"
        switch_data = switch_resp.json()

        # Assert the returned user context includes the active institution set to institution_id
        active_inst = None
        if "activeInstitution" in switch_data and switch_data["activeInstitution"]:
            active_inst = switch_data["activeInstitution"]
        elif "institutionId" in switch_data:
            active_inst = {"id": switch_data["institutionId"]}
        elif "active_institution" in switch_data:
            active_inst = switch_data["active_institution"]

        assert active_inst, "Response missing active institution info after switch"
        assert "id" in active_inst, "Active institution info missing id field"
        assert active_inst["id"] == institution_id, "Active institution id does not match institutionId sent"

        # Optionally assert user context changed: verify user id consistency
        assert "id" in switch_data, "User data missing id after switch institution"
        assert switch_data["id"] == me_data.get("id"), "User ID changed unexpectedly after institution switch"

    finally:
        session.close()


test_post_auth_switch_institution_with_valid_institution_id()