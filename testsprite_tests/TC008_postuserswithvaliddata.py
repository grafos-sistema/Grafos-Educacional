import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

# Replace these with valid admin credentials for authentication
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "StrongPassword123!"

def test_post_users_with_valid_data():
    # Step 1: Authenticate to get Bearer token
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    try:
        login_response = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        tokens_user = login_response.json()
        access_token = None
        # Attempt to get access token with expected key
        if isinstance(tokens_user, dict):
            if "accessToken" in tokens_user and isinstance(tokens_user["accessToken"], str):
                access_token = tokens_user["accessToken"]
            elif "access_token" in tokens_user and isinstance(tokens_user["access_token"], str):
                access_token = tokens_user["access_token"]
            elif "tokens" in tokens_user and isinstance(tokens_user["tokens"], dict):
                if "accessToken" in tokens_user["tokens"] and isinstance(tokens_user["tokens"]["accessToken"], str):
                    access_token = tokens_user["tokens"]["accessToken"]
            elif "token" in tokens_user and isinstance(tokens_user["token"], str):
                access_token = tokens_user["token"]
        if not access_token:
            raise AssertionError("Access token not found in login response")
    except Exception as e:
        raise AssertionError(f"Authentication step failed: {e}")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Step 2: Get user profile to extract institutionId if possible
    auth_me_url = f"{BASE_URL}/auth/me"
    try:
        me_response = requests.get(auth_me_url, headers=headers, timeout=TIMEOUT)
        assert me_response.status_code == 200, f"Auth/me failed with status {me_response.status_code}"
        user_profile = me_response.json()

        # Try to find an institutionId linked to the user
        institution_id = None
        if isinstance(user_profile, dict):
            if "institutionId" in user_profile:
                institution_id = user_profile["institutionId"]
            elif "institutions" in user_profile and isinstance(user_profile["institutions"], list) and len(user_profile["institutions"]) > 0:
                institution_id = user_profile["institutions"][0].get("id")
            elif "activeInstitutionId" in user_profile:
                institution_id = user_profile["activeInstitutionId"]

        # If not found, fallback: query /institutions endpoint to get an institutionId
        if not institution_id:
            institutions_url = f"{BASE_URL}/institutions"
            inst_resp = requests.get(institutions_url, headers=headers, timeout=TIMEOUT)
            assert inst_resp.status_code == 200, f"Institutions fetch failed with status {inst_resp.status_code}"
            inst_data = inst_resp.json()
            institutions_list = inst_data.get("data") or inst_data.get("items") or []
            if institutions_list and len(institutions_list) > 0:
                institution_id = institutions_list[0].get("id")

        if not institution_id:
            raise AssertionError("Institution ID not found for user or institution listing")
    except Exception as e:
        raise AssertionError(f"Failed obtaining institutionId: {e}")

    # Step 3: Create new user with valid data
    post_users_url = f"{BASE_URL}/users"
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    user_payload = {
        "firstName": "TestFirstName",
        "lastName": "TestLastName",
        "email": unique_email,
        "role": "STAFF",  # Assuming "STAFF" is a valid role, adjust if needed
        "institutionId": institution_id
    }

    created_user_id = None

    try:
        create_resp = requests.post(post_users_url, headers=headers, json=user_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"User creation failed with status {create_resp.status_code}"
        created_user = create_resp.json()
        created_user_id = created_user.get("id")
        assert created_user_id is not None, "Created user ID not returned"
        # Additional assertions to verify returned data matches input
        assert created_user.get("firstName") == user_payload["firstName"], "firstName mismatch"
        assert created_user.get("lastName") == user_payload["lastName"], "lastName mismatch"
        assert created_user.get("email") == user_payload["email"], "email mismatch"
        assert created_user.get("role") == user_payload["role"], "role mismatch"
        assert created_user.get("institutionId") == user_payload["institutionId"], "institutionId mismatch"
    finally:
        # Cleanup: delete created user if ID present
        if created_user_id:
            delete_url = f"{BASE_URL}/users/{created_user_id}"
            try:
                del_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200,204), f"Failed to delete user {created_user_id}, status {del_resp.status_code}"
            except Exception:
                pass

test_post_users_with_valid_data()
