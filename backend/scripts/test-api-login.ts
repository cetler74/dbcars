import axios from 'axios';

async function testAPILogin() {
  try {
    console.log('Testing login API endpoint...\n');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@dbcars.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response from server. Is the backend running?');
      console.log('Make sure to run: cd backend && npm run dev');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAPILogin();

