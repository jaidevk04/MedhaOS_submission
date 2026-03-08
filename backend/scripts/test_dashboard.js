
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:4000/api';

async function testDashboard() {
  try {
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${API_URL}/patients/login`, {
      email: 'kjaidev@tataelxsi.co.in',
      password: 'jaidev'
    });

    if (!loginRes.data.success) {
      console.error('Login failed');
      return;
    }

    const token = loginRes.data.token;
    console.log('Login successful. Token obtained.');
    console.log('Patient ID from login:', loginRes.data.patient.id);

    console.log('2. Fetching Dashboard Stats...');
    const dashboardRes = await axios.get(`${API_URL}/dashboard/patient`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Dashboard Response:', JSON.stringify(dashboardRes.data, null, 2));

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testDashboard();
