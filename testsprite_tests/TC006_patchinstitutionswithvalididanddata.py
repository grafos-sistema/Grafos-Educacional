import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

# Replace with valid admin user credentials for authentication
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "AdminPass123!"

def authenticate():
    url = f"{BASE_URL}/auth/login"
    payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    token = data.get("accessToken") or data.get("access_token") or data.get("token")
    if not token:
        raise Exception("Authentication token not found in response")
    return token

def create_institution(token, name, cnpj, email, phone):
    url = f"{BASE_URL}/institutions"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "cnpj": cnpj,
        "email": email,
        "phone": phone
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def delete_institution(token, institution_id):
    # The PRD does not explicitly show a DELETE endpoint for institutions,
    # so this is a placeholder if such endpoint exists.
    # If not, skip deletion or implement deactivation if possible.
    pass

def patch_institution(token, institution_id, update_data):
    url = f"{BASE_URL}/institutions/{institution_id}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.patch(url, json=update_data, headers=headers, timeout=TIMEOUT)
    return resp

def test_patch_institution_with_valid_id_and_data():
    token = authenticate()

    # Create a new institution to update
    unique_suffix = str(uuid.uuid4())[:8]
    orig_name = f"Test Institution {unique_suffix}"
    orig_cnpj = f"12.345.678/0001-{unique_suffix[0:2]}"
    orig_email = f"contact{unique_suffix}@testinst.com"
    orig_phone = f"+5511999999{unique_suffix[0:4]}"
    institution = create_institution(token, orig_name, orig_cnpj, orig_email, orig_phone)
    institution_id = institution.get("id")
    assert institution_id, "Created institution must have an id"

    update_data = {
        "name": f"Updated Institution {unique_suffix}",
        "email": f"updated{unique_suffix}@testinst.com",
        "phone": f"+5511888888{unique_suffix[0:4]}"
    }

    try:
        response = patch_institution(token, institution_id, update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        updated_inst = response.json()
        assert updated_inst.get("id") == institution_id, "Institution ID must match"
        assert updated_inst.get("name") == update_data["name"], "Name should be updated"
        assert updated_inst.get("email") == update_data["email"], "Email should be updated"
        assert updated_inst.get("phone") == update_data["phone"], "Phone should be updated"
    finally:
        # Clean up institution if deletion endpoint exists
        # delete_institution(token, institution_id)
        pass

test_patch_institution_with_valid_id_and_data()