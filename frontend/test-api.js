// Simple test to check API response
fetch('http://localhost:8000/api/v1/requests/statistics?role=executor')
  .then(response => response.json())
  .then(data => {
    console.log('Statistics API response:', data);
  })
  .catch(error => {
    console.error('Statistics API error:', error);
  });

fetch('http://localhost:8000/api/v1/requests?role=executor')
  .then(response => response.json())
  .then(data => {
    console.log('Requests API response:', data);
  })
  .catch(error => {
    console.error('Requests API error:', error);
  });
