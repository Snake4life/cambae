import json


def test_status_return_value(client):
    response = client.get('/api/v1/status')

    expected = {
        "status": "Up and running"
    }

    assert expected == json.loads(response.data)


def test_status_return_code(client):
    response = client.get('/api/v1/status')

    expected = 200

    assert expected == response.status_code