import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Credentials for authentication - should be replaced by valid admin user credentials for testing
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "AdminPassword123!"

def test_get_institutions_with_valid_filters():
    """
    Test GET /institutions with valid Bearer token and filters.
    Verifies 200 response with paginated institution list.
    """
    login_url = f"{BASE_URL}/auth/login"
    institutions_url = f"{BASE_URL}/institutions"
    headers = {}
    
    try:
        # Authenticate to get JWT token
        login_payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status code {login_resp.status_code} and response {login_resp.text}"
        login_data = login_resp.json()
        assert "accessToken" in login_data, "accessToken missing in login response"
        access_token = login_data["accessToken"]
        
        # Prepare headers with Bearer token
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Define valid filters if applicable: based on PRD "filters" but no explicit filter schema given.
        # We'll test with pagination params as filter examples.
        params = {
            "page": 1,
            "limit": 10
        }
        
        # Request institutions list
        resp = requests.get(institutions_url, headers=headers, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}. Response: {resp.text}"
        
        data = resp.json()
        # Validate that response contains pagination structure and list of institutions
        # Typical paginated response might have keys like: items, meta, totalCount
        # Since no exact schema provided, assert keys presence heuristically
        assert isinstance(data, dict), "Response JSON is not an object"
        
        # Check for expected pagination keys (heuristic)
        pagination_keys = ["items", "meta"]
        for key in pagination_keys:
            assert key in data, f"Response missing expected key: {key}"
        
        # Validate items is a list
        assert isinstance(data["items"], list), "'items' should be a list"
        
        # Optionally validate meta info if present
        if "meta" in data and isinstance(data["meta"], dict):
            # Check for page info
            for meta_key in ["page", "limit", "totalCount"]:
                assert meta_key in data["meta"], f"Pagination meta missing key: {meta_key}"
        
        # If institutions returned, verify they have expected fields
        if len(data["items"]) > 0:
            institution = data["items"][0]
            # Expected fields based on POST /institutions creation schema
            expected_fields = ["id", "name", "cnpj", "email", "phone"]
            for field in expected_fields:
                assert field in institution, f"Institution missing expected field: {field}"
                
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_get_institutions_with_valid_filters()
