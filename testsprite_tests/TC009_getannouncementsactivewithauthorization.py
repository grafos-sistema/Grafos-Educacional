import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace with valid user credentials that have permission to view active announcements
VALID_EMAIL = "admin@example.com"
VALID_PASSWORD = "password123"

def test_get_announcements_active_with_authorization():
    try:
        # Authenticate user to get Bearer token
        login_resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        tokens = login_resp.json()
        access_token = tokens.get("accessToken") or tokens.get("access_token") or tokens.get("token")
        assert access_token, f"No access token returned on login: {tokens}"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Call GET /announcements/active with valid Bearer token
        active_resp = requests.get(
            f"{BASE_URL}/announcements/active",
            headers=headers,
            timeout=TIMEOUT
        )
        assert active_resp.status_code == 200, f"Expected 200 but got {active_resp.status_code}: {active_resp.text}"

        announcements = active_resp.json()
        assert isinstance(announcements, list), f"Response is not a list: {announcements}"

        # Optional: Validate structure of each announcement if any present
        for ann in announcements:
            assert "id" in ann, "Announcement missing 'id'"
            assert "title" in ann, "Announcement missing 'title'"
            assert "content" in ann, "Announcement missing 'content'"
            # Additional checks can be added based on Announcement schema

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_get_announcements_active_with_authorization()
