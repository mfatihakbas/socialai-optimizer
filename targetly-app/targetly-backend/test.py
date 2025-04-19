import requests

response = requests.post('http://localhost:5000/login', json={
    "email": "admin@example.com",
    "password": "123456"
})

print("Status Code:", response.status_code)
print("Response:", response.json())
