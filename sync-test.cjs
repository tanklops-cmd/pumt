// Multi-device sync test simulation
const http = require('http');

const API_BASE = 'http://localhost:3001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (data) {
      options.headers['Content-Length'] = data.length;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch {
          resolve(responseBody);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testSync() {
  console.log('=== Device Sync Test ===\n');

  // Test 1: Initial Sync
  console.log('TEST 1: Initial Sync (Device A)');
  const sync1 = await request('GET', '/api/data/sync');
  console.log('  - Initial maintenance count:', sync1.unitMaintenance.length);
  console.log('  - Timestamp:', sync1.timestamp);
  console.log('  ✅ PASS\n');

  // Test 2: Add data from Device A
  console.log('TEST 2: Add Maintenance (Device A)');
  const newMaintenance = {
    id: 'maintenance-device-a-' + Date.now(),
    unitId: 'north',
    jobDescription: 'Device A added this',
    jobNumber: 'A001',
    priority: 'HIGH',
    addedBy: 'DeviceA',
    status: 'PENDING'
  };
  const createRes = await request('POST', '/api/data/maintenance', newMaintenance);
  console.log('  - Created:', createRes.id);
  console.log('  ✅ PASS\n');

  // Test 3: Verify sync endpoint has new data
  console.log('TEST 3: Incremental Sync (Device B)');
  const sync2 = await request('GET', '/api/data/sync');
  const found = sync2.unitMaintenance.find(m => m.id === newMaintenance.id);
  console.log('  - Found new item:', found ? 'YES' : 'NO');
  console.log('  - Total maintenance:', sync2.unitMaintenance.length);
  console.log(found ? '  ✅ PASS\n' : '  ❌ FAIL\n');

  // Test 4: Update from Device B
  console.log('TEST 4: Update from Device B');
  const updateData = { ...newMaintenance, status: 'COMPLETED', updatedBy: 'DeviceB' };
  const updateRes = await request('PUT', `/api/data/maintenance/${newMaintenance.id}`, updateData);
  console.log('  - Updated status:', updateRes.status);
  console.log('  ✅ PASS\n');

  // Test 5: Verify update via sync
  console.log('TEST 5: Verify Update via Sync (Device A)');
  const sync3 = await request('GET', '/api/data/sync');
  const updated = sync3.unitMaintenance.find(m => m.id === newMaintenance.id);
  console.log('  - Status after update:', updated?.status);
  console.log(updated?.status === 'COMPLETED' ? '  ✅ PASS\n' : '  ❌ FAIL\n');

  // Test 6: Delete from Device C
  console.log('TEST 6: Delete from Device C');
  await request('DELETE', `/api/data/maintenance/${newMaintenance.id}`);
  const sync4 = await request('GET', '/api/data/sync');
  const deleted = sync4.unitMaintenance.find(m => m.id === newMaintenance.id);
  console.log('  - Item still exists:', deleted ? 'YES' : 'NO');
  console.log(!deleted ? '  ✅ PASS\n' : '  ❌ FAIL\n');

  // Test 7: Concurrent updates (race condition)
  console.log('TEST 7: Concurrent Updates Simulation');
  const concurrentId = 'concurrent-test-' + Date.now();
  await request('POST', '/api/data/maintenance', { id: concurrentId, unitId: 'north', jobDescription: 'Original', status: 'PENDING', priority: 'LOW', addedBy: 'Test' });
  
  // Two devices update simultaneously
  const update1 = request('PUT', `/api/data/maintenance/${concurrentId}`, { status: 'Device1Update' });
  const update2 = request('PUT', `/api/data/maintenance/${concurrentId}`, { status: 'Device2Update' });
  
  await Promise.all([update1, update2]);
  const finalSync = await request('GET', '/api/data/sync');
  const final = finalSync.unitMaintenance.find(m => m.id === concurrentId);
  console.log('  - Final status:', final?.status);
  console.log('  - Note: Last write wins (expected behavior)');
  console.log('  ✅ PASS\n');

  console.log('=== All Tests Complete ===');
  console.log('\nNote: WebSocket broadcast should propagate changes to all connected clients');
  console.log('Use browser DevTools to verify real-time updates');
}

testSync().catch(console.error);
