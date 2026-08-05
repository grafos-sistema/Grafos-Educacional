import requests

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def test_get_auth_me_with_valid_token():
    login_url = f"{BASE_URL}/auth/login"
    auth_me_url = f"{BASE_URL}/auth/me"

    login_payload = {
        "email": "admin@santacruz.edu.br",
        "password": "admin1234"
    }

    try:
        # Authenticate to get a valid token
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status code {login_resp.status_code}"
        login_data = login_resp.json()
        assert "accessToken" in login_data, "accessToken missing in login response"

        access_token = login_data["accessToken"]

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Call GET /auth/me with valid token
        auth_me_resp = requests.get(auth_me_url, headers=headers, timeout=TIMEOUT)
        assert auth_me_resp.status_code == 200, f"GET /auth/me failed with status code {auth_me_resp.status_code}"

        user_profile = auth_me_resp.json()
        # Basic validations for user profile keys
        assert isinstance(user_profile, dict), "User profile response is not a JSON object"
        assert "id" in user_profile, "User profile missing 'id'"
        assert "email" in user_profile, "User profile missing 'email'"
        assert user_profile["email"] == login_payload["email"], "User profile email does not match login email"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_auth_me_with_valid_token()