const axios = require('axios');

async function test() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'doctor@medhaos.com',
      password: 'doctor123',
      role: 'staff'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    // 2. Fetch Appointments for Today (2026-03-06)
    const dateStr = '2026-03-06';
    console.log(`Fetching appointments for ${dateStr}...`);
    
    const apptRes = await axios.get(`http://localhost:4000/api/appointments?date=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Response:', JSON.stringify(apptRes.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
