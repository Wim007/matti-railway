/**
 * Test script to verify Matti → Dashboard analytics integration
 * This simulates a SESSION_START event being sent to the Dashboard
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const ANALYTICS_CONFIG = {
  apiKey: process.env.MATTI_DASHBOARD_API_KEY,
  endpoint: process.env.ANALYTICS_ENDPOINT,
};

console.log('[Test] Analytics Configuration:');
console.log('  API Key:', ANALYTICS_CONFIG.apiKey ? `${ANALYTICS_CONFIG.apiKey.substring(0, 15)}...` : 'NOT SET');
console.log('  Endpoint:', ANALYTICS_CONFIG.endpoint || 'NOT SET');
console.log('');

if (!ANALYTICS_CONFIG.apiKey || !ANALYTICS_CONFIG.endpoint) {
  console.error('[Test] ERROR: Analytics configuration is missing!');
  console.error('  Make sure .env.local exists with MATTI_DASHBOARD_API_KEY and ANALYTICS_ENDPOINT');
  process.exit(1);
}

// Simulate a SESSION_START event
const testEvent = {
  type: "SESSION_START",
  appName: "matti",
  postalCodeArea: "3011",
  ageGroup: "14-15",
  userType: "jongere",
  familyType: null,
  themes: ["school"],
  sessionDuration: 0,
  messageCount: 0,
  isHighRisk: false,
  safetySignal: false,
  satisfactionScore: null,
  selfReportedImprovement: null,
  referralType: null,
};

console.log('[Test] Sending SESSION_START event to Dashboard...');
console.log('[Test] Event data:', JSON.stringify(testEvent, null, 2));
console.log('');

try {
  const response = await fetch(ANALYTICS_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ANALYTICS_CONFIG.apiKey,
    },
    body: JSON.stringify(testEvent),
  });

  console.log('[Test] Response status:', response.status, response.statusText);

  if (response.ok) {
    const data = await response.json();
    console.log('[Test] Response data:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('✅ [Test] SUCCESS! Event sent to Dashboard');
    console.log('   Check Dashboard at: https://3000-ig0nvibh1ceu0bbrws20i-3a22751a.us1.manus.computer');
    console.log('   Look for "Totaal Gebeurtenissen" to increase');
  } else {
    const errorText = await response.text();
    console.error('[Test] ERROR Response:', errorText);
    console.log('');
    console.log('❌ [Test] FAILED! Dashboard returned error');
  }
} catch (error) {
  console.error('[Test] ERROR:', error.message);
  console.log('');
  console.log('❌ [Test] FAILED! Could not connect to Dashboard');
}
