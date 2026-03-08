const axios = require('axios');

async function test() {
  try {
    const transcript = "Patient has fever and headache.";
    console.log('Testing generate-soap...');
    
    // No auth needed for this test if I removed it, or I need to login.
    // routes/clinical.js doesn't use authenticateToken middleware on router?
    // Let's check server.js mount.
    // app.use('/api/clinical', clinicalRoutes); 
    // clinical.js: router.post('/scribe/generate-soap', ...)
    // It does NOT use authenticateToken in definition. So public? 
    // Wait, let's check clinical.js content again.
    
    const res = await axios.post('http://localhost:4000/api/clinical/scribe/generate-soap', {
      transcript: transcript,
      patient_context: {}
    });
    
    console.log('Response:', res.status, res.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
  }
}

test();
