import requests
import datetime

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

VALID_EMAIL = "admin@example.com"
VALID_PASSWORD = "AdminPass123!"

def test_post_events_with_valid_data():
    token = None
    created_event_id = None
    try:
        # Authenticate to get Bearer token
        login_resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        auth_data = login_resp.json()
        token = auth_data.get("accessToken") or auth_data.get("access_token") or auth_data.get("token")
        assert token, "No access token returned in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Retrieve user profile to obtain institution context if needed
        me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Failed to get user profile: {me_resp.text}"
        user_profile = me_resp.json()

        # We need academicYearId to create event. Attempt to fetch events or academic years:
        # Since PRD doesn't specify an academic year endpoint,
        # we try to get upcoming events and extract academicYearId if possible,
        # or else skip test with assertion failure.
        events_resp = requests.get(f"{BASE_URL}/events/upcoming", headers=headers, timeout=TIMEOUT)
        assert events_resp.status_code == 200, f"Failed to get upcoming events: {events_resp.text}"
        events_list = events_resp.json()
        academic_year_id = None

        if events_list and isinstance(events_list, list):
            first_event = events_list[0] if len(events_list) > 0 else None
            if first_event and "academicYearId" in first_event:
                academic_year_id = first_event["academicYearId"]

        # If could not find academicYearId in upcoming events, raise error (cannot proceed)
        assert academic_year_id, "No academicYearId found in upcoming events to create event with"

        # Prepare event data
        today = datetime.date.today()
        start_date = today.isoformat()

        event_payload = {
            "title": "Test Event Created by Automation",
            "type": "Institutional",
            "startDate": start_date,
            "academicYearId": academic_year_id,
        }

        # Create a new event
        post_event_resp = requests.post(
            f"{BASE_URL}/events",
            headers=headers,
            json=event_payload,
            timeout=TIMEOUT,
        )
        assert post_event_resp.status_code == 201, f"Event creation failed: {post_event_resp.text}"
        event_data = post_event_resp.json()
        created_event_id = event_data.get("id")
        assert created_event_id, "Created event has no ID"

        # Validate response fields
        assert event_data.get("title") == event_payload["title"]
        assert event_data.get("type") == event_payload["type"]
        assert event_data.get("startDate") == event_payload["startDate"]
        assert event_data.get("academicYearId") == event_payload["academicYearId"]

    finally:
        # Clean up: delete created event if exists
        if created_event_id and token:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}/events/{created_event_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=TIMEOUT,
                )
                # Either 204 No Content or 200 OK expected on delete success
                assert delete_resp.status_code in (200, 204), f"Failed to delete event: {delete_resp.text}"
            except Exception:
                pass


test_post_events_with_valid_data()