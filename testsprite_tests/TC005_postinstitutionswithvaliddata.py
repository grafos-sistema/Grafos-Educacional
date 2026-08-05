import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

def postinstitutionswithvaliddata():
    # Presuming we have admin credentials to authenticate and get Bearer token
    auth_url = f"{BASE_URL}/auth/login"
    institutions_url = f"{BASE_URL}/institutions"

    admin_email = "admin@example.com"
    admin_password = "AdminPass123!"

    try:
        # Authenticate to get token
        auth_resp = requests.post(
            auth_url,
            json={"email": admin_email, "password": admin_password},
            timeout=TIMEOUT
        )
        assert auth_resp.status_code == 200, f"Login failed with status {auth_resp.status_code}"
        auth_data = auth_resp.json()
        access_token = auth_data.get("accessToken")
        assert access_token, "No access token received"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Prepare institution data with unique name and email
        unique_suffix = str(uuid.uuid4())[:8]
        institution_payload = {
            "name": f"Test Institution {unique_suffix}",
            "cnpj": "12345678000195",
            "email": f"testinstitution{unique_suffix}@example.com",
            "phone": "+5511999999999"
        }

        # Create institution
        create_resp = requests.post(institutions_url, json=institution_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected status 201 but got {create_resp.status_code}"
        institution = create_resp.json()

        # Validate returned institution data matches sent data
        assert institution.get("name") == institution_payload["name"], "Institution name mismatch"
        assert institution.get("cnpj") == institution_payload["cnpj"], "Institution CNPJ mismatch"
        assert institution.get("email") == institution_payload["email"], "Institution email mismatch"
        assert institution.get("phone") == institution_payload["phone"], "Institution phone mismatch"
        assert "id" in institution and institution["id"], "Institution ID not returned"

    finally:
        # Cleanup: no deletion as DELETE not supported or specified
        pass

postinstitutionswithvaliddata()
