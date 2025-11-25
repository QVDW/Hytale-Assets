const fetch = require('node-fetch');
require('dotenv').config();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function resetFooterSettings() {
  console.log('Resetting footer settings to defaults...');
  
  try {
    const deleteResponse = await fetch(`${API_URL}/api/settings/footer`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log('Footer settings successfully reset to defaults!');
    } else {
      const data = await deleteResponse.json();
      console.error('Failed to reset settings:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error during reset:', error.message);
  }
}

resetFooterSettings(); 