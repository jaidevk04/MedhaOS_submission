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

    // 2. Test /test endpoint
    try {
      const testRes = await axios.get('http://localhost:4000/api/appointments/test', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Test endpoint:', testRes.data);
    } catch (e) {
      console.error('Test endpoint failed:', e.response ? e.response.status : e.message);
    }

    // ... (rest of logic)
  } catch (error) {
    console.error(error);
  }
}
test();
