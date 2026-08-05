import requests

BASE_URL = "http://localhost:3000/api"
LOGIN_EMAIL = "admin@example.com"
LOGIN_PASSWORD = "AdminPass123!"
TIMEOUT = 30

def test_get_users_with_valid_filters():
    # Step 1: Authenticate to get Bearer token
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD}
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        access_token = login_data.get("accessToken")
        assert access_token, "Access token not found in login response"
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    headers = {"Authorization": f"Bearer {access_token}"}

    # Step 2: Call GET /users without filters (should return paginated list)
    users_url = f"{BASE_URL}/users"
    try:
        resp = requests.get(users_url, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "items" in data or "data" in data or isinstance(data, dict), "Paginated users list missing"
    except requests.RequestException as e:
        assert False, f"Request to /users failed: {e}"

    # Step 3: Call GET /users with role filter
    params_role = {"role": "ADMIN"}
    try:
        resp_role = requests.get(users_url, headers=headers, params=params_role, timeout=TIMEOUT)
        assert resp_role.status_code == 200, f"Expected 200 with role filter, got {resp_role.status_code}"
        data_role = resp_role.json()
        assert isinstance(data_role, dict), "Expected JSON object for users list with role filter"
    except requests.RequestException as e:
        assert False, f"Request to /users with role filter failed: {e}"

    # Step 4: Call GET /users with institution filter
    # To do this, first get current user profile to find institutionId
    me_url = f"{BASE_URL}/auth/me"
    try:
        me_resp = requests.get(me_url, headers=headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Profile fetch failed with status {me_resp.status_code}"
        me_data = me_resp.json()
        # institutionId may be under activeInstitution or institutions[0]
        institution_id = None
        if "activeInstitution" in me_data and me_data["activeInstitution"]:
            institution_id = me_data["activeInstitution"].get("id")
        elif "institutions" in me_data and len(me_data["institutions"]) > 0:
            institution_id = me_data["institutions"][0].get("id")
        assert institution_id, "No institutionId found in user profile"
    except requests.RequestException as e:
        assert False, f"Request to /auth/me failed: {e}"

    params_inst = {"institution": institution_id}
    try:
        resp_inst = requests.get(users_url, headers=headers, params=params_inst, timeout=TIMEOUT)
        assert resp_inst.status_code == 200, f"Expected 200 with institution filter, got {resp_inst.status_code}"
        data_inst = resp_inst.json()
        assert isinstance(data_inst, dict), "Expected JSON object for users list with institution filter"
    except requests.RequestException as e:
        assert False, f"Request to /users with institution filter failed: {e}"

test_get_users_with_valid_filters()