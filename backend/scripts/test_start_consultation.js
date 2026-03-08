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
    console.log('Login successful.');

    // 2. Get Appointments
    const dateStr = '2026-03-06';
    console.log(`Fetching appointments for ${dateStr}...`);
    const apptRes = await axios.get(`http://localhost:4000/api/appointments?date=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const appointments = apptRes.data.appointments;
    if (appointments.length === 0) {
      console.log('No appointments found.');
      return;
    }

    const aptId = appointments[0].appointment_id;
    console.log(`Testing start-consultation for appointment: ${aptId}`);

    // 3. Start Consultation
    const startRes = await axios.post(
      `http://localhost:4000/api/appointments/${aptId}/start-consultation`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('Start Consultation Response:', startRes.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.status + ' ' + JSON.stringify(error.response.data) : error.message);
  }
}

test();
