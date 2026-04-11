#!/usr/bin/env node

/**
 * Backend API Testing Script
 * Tests user registration, login, and MongoDB storage
 */

const API_URL = 'http://localhost:4000/api';

async function testAPI() {
  console.log('🧪 BACKEND API TESTING SUITE\n');

  // Test 1: Health Check
  console.log('1️⃣  Testing Backend Health...');
  try {
    const healthRes = await fetch('http://localhost:4000/health');
    const health = await healthRes.json();
    console.log('✅ Backend is running:', health);
  } catch (err) {
    console.log('❌ Backend is NOT running');
    return;
  }

  // Test 2: User Registration
  console.log('\n2️⃣  Testing User Registration...');
  const testEmail = `testuser_${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const signupRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    });
    
    const signupData = await signupRes.json();
    
    if (signupRes.ok) {
      console.log('✅ User registered successfully');
      console.log('   Email:', testEmail);
      console.log('   User ID:', signupData.user?.id);
      console.log('   Token received:', !!signupData.token);
    } else {
      console.log('❌ Registration failed:', signupData.message);
    }
  } catch (err) {
    console.log('❌ Registration error:', err.message);
  }

  // Test 3: User Login
  console.log('\n3️⃣  Testing User Login...');
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginRes.json();
    
    if (loginRes.ok) {
      console.log('✅ Login successful');
      console.log('   Token:', loginData.token.substring(0, 20) + '...');
      console.log('   User Role:', loginData.user?.role);
      
      // Test 4: Fetch user profile with token
      console.log('\n4️⃣  Testing Protected Route (Get Profile)...');
      try {
        const profileRes = await fetch(`${API_URL}/profile/${loginData.user?.id}`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileRes.ok) {
          console.log('✅ Protected route works - Token is valid');
        } else {
          console.log('⚠️  Protected route returned:', profileRes.status);
        }
      } catch (err) {
        console.log('⚠️  Protected route error:', err.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
  } catch (err) {
    console.log('❌ Login error:', err.message);
  }

  // Test 5: Check MongoDB
  console.log('\n5️⃣  MongoDB Storage Status:');
  console.log('   📊 Check MongoDB Compass or Atlas UI to verify user was stored');
  console.log('   Database: alumni');
  console.log('   Collection: users');

  console.log('\n✨ API Testing Complete!\n');
}

testAPI();
