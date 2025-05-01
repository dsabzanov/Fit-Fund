/**
 * FitFund Admin Setup Utility
 * 
 * This script helps you create an admin user for FitFund.
 * To use it, open your browser console and paste this entire script.
 * Then call the createAdminUser function with your desired credentials.
 * 
 * Example:
 *   createAdminUser('admin', 'yourpassword', 'admin@example.com');
 */

async function createAdminUser(username, password, email = null) {
  if (!username || !password) {
    console.error('Username and password are required!');
    return;
  }
  
  try {
    console.log('Attempting to create admin user:', username);
    
    const response = await fetch('/api/register-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        email,
        devCode: 'fitfund-admin-2024'
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log('User details:', data);
      console.log('You can now log in with these credentials and access the admin dashboard.');
      return data;
    } else {
      console.error('❌ Failed to create admin user:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return null;
  }
}

// Instructions
console.log(`
=========================================
FitFund Admin Setup Utility
=========================================

To create an admin user, run:
createAdminUser('username', 'password', 'email');

Example:
createAdminUser('admin', 'securepassword', 'admin@example.com');

After creating the admin user, you can log in normally
and access the admin dashboard at /admin.
=========================================
`);