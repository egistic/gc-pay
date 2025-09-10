#!/bin/bash

# This script is intended to be run on the server to test CORS configuration.

echo "Testing CORS for gcback.openlayers.kz..."

# Test OPTIONS request for /api/v1/users
echo "Testing OPTIONS /api/v1/users..."
curl -v -X OPTIONS \
     -H "Origin: https://gcpay.openlayers.kz" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     https://gcback.openlayers.kz/api/v1/users

echo ""
echo "Testing OPTIONS /api/v1/requests/list..."
curl -v -X OPTIONS \
     -H "Origin: https://gcpay.openlayers.kz" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     https://gcback.openlayers.kz/api/v1/requests/list?role=executor

echo ""
echo "Testing GET /api/v1/health..."
curl -v https://gcback.openlayers.kz/health

echo ""
echo "CORS tests completed. Review the output for 'Access-Control-Allow-Origin' and '200 OK' status."
