import requests

def test_post_auth_login_with_valid_credentials():
    base_url = "http://localhost:3000/api"
    login_url = f"{base_url}/auth/login"
    headers = {"Content-Type": "application/json"}

    # Use valid credentials for test - these should be replaced with valid test credentials
    payload = {
        "email": "validuser@example.com",
        "password": "ValidPass123!"
    }

    try:
        response = requests.post(login_url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to POST /auth/login failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response payload is not valid JSON"

    # Validate presence of keys in response
    assert "accessToken" in data, "Response missing 'accessToken'"
    assert isinstance(data["accessToken"], str) and len(data["accessToken"]) > 0, "'accessToken' should be a non-empty string"

    assert "refreshToken" in data, "Response missing 'refreshToken'"
    assert isinstance(data["refreshToken"], str) and len(data["refreshToken"]) > 0, "'refreshToken' should be a non-empty string"

    assert "user" in data, "Response missing 'user' payload"
    user = data["user"]
    assert isinstance(user, dict), "'user' payload should be a dictionary"
    # Basic checks for typical user payload keys
    assert "id" in user and isinstance(user["id"], (str, int)), "'user' should have an 'id'"
    assert "email" in user and user["email"] == payload["email"], "'user.email' should match the login email"

test_post_auth_login_with_valid_credentials()