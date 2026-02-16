// Comprehensive multi-device sync test
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

async function testAllSync() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       MULTI-DEVICE SYNC TEST - ALL FEATURES');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: UNIT MAINTENANCE
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 1: UNIT MAINTENANCE SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const maintId = 'maint-test-' + Date.now();
  const maintenance = {
    id: maintId,
    unitId: 'north',
    jobDescription: 'Test maintenance job',
    jobNumber: 'TEST-001',
    priority: 'Routine',
    status: 'Logged',
    addedBy: 'DeviceA',
    addedAt: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10)
  };
  
  const createMaint = await request('POST', '/api/data/maintenance', maintenance);
  console.log('  Device A created maintenance:', createMaint.id);
  
  // Verify sync endpoint
  const sync1 = await request('GET', '/api/data/sync');
  const foundMaint = sync1.unitMaintenance.find(m => m.id === maintId);
  console.log('  Device B sees new maintenance:', foundMaint ? '✅ YES' : '❌ NO');
  
  // Update status
  const updateMaint = await request('PUT', `/api/data/maintenance/${maintId}`, { ...maintenance, status: 'Completed' });
  console.log('  Device A updated status to:', updateMaint.status);
  
  // Verify update via sync
  const sync2 = await request('GET', '/api/data/sync');
  const updatedMaint = sync2.unitMaintenance.find(m => m.id === maintId);
  console.log('  Device C sees updated status:', updatedMaint?.status === 'Completed' ? '✅ YES' : '❌ NO');
  
  // Delete
  await request('DELETE', `/api/data/maintenance/${maintId}`);
  const sync3 = await request('GET', '/api/data/sync');
  const deletedMaint = sync3.unitMaintenance.find(m => m.id === maintId);
  console.log('  Device D sees deletion:', !deletedMaint ? '✅ YES' : '❌ NO');
  console.log('  ✅ MAINTENANCE SYNC TEST COMPLETE\n');

  // Test 2: STRIP SEARCHES
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 2: STRIP SEARCH SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const stripSearch = {
    unitId: 'north',
    date: new Date().toISOString().slice(0, 10),
    performed: true,
    prisonerIds: ['PRISONER-001', 'PRISONER-002']
  };
  
  const createStrip = await request('POST', '/api/data/strip-search', stripSearch);
  console.log('  Device A created strip search:', createStrip.unitId);
  
  const syncStrip = await request('GET', '/api/data/sync');
  const foundStrip = syncStrip.stripSearches.find(s => s.unitId === 'north' && s.date === stripSearch.date);
  console.log('  Device B sees strip search:', foundStrip ? '✅ YES' : '❌ NO');
  console.log('  ✅ STRIP SEARCH SYNC TEST COMPLETE\n');

  // Test 3: RANDOM SEARCHES
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 3: RANDOM SEARCHES SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const searches = {
    unitId: 'north',
    date: new Date().toISOString().slice(0, 10),
    targets: [
      { type: 'cell', value: 'Cell-1', unitId: 'north', date: new Date().toISOString().slice(0, 10) },
      { type: 'cell', value: 'Cell-2', unitId: 'north', date: new Date().toISOString().slice(0, 10) },
      { type: 'facility', value: 'Kitchen', unitId: 'north', date: new Date().toISOString().slice(0, 10) }
    ]
  };
  
  const createSearch = await request('POST', '/api/data/searches', searches);
  console.log('  Device A created searches:', searches.targets.length, 'targets');
  
  const syncSearch = await request('GET', '/api/data/sync');
  const foundSearches = syncSearch.searchTargets.filter(s => s.unitId === 'north');
  console.log('  Device B sees searches:', foundSearches.length > 0 ? '✅ YES (' + foundSearches.length + ')' : '❌ NO');
  console.log('  ✅ RANDOM SEARCHES SYNC TEST COMPLETE\n');

  // Test 4: CELL ALARMS
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 4: CELL ALARM SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const weekKey = new Date().toISOString().slice(0, 10);
  const alarm = {
    id: 'alarm-test-' + Date.now(),
    unitId: 'north',
    cell: 'Cell-101',
    weekKey: weekKey,
    checked: false
  };
  
  const createAlarm = await request('POST', '/api/data/alarms', alarm);
  console.log('  Device A created alarm:', createAlarm.cell);
  
  const syncAlarm = await request('GET', '/api/data/sync');
  const foundAlarm = syncAlarm.cellAlarms.find(a => a.id === alarm.id);
  console.log('  Device B sees alarm:', foundAlarm ? '✅ YES' : '❌ NO');
  
  // Update alarm
  const updateAlarm = await request('PUT', `/api/data/alarms/${alarm.id}`, { ...alarm, checked: true });
  console.log('  Device A checked alarm');
  
  const syncAlarm2 = await request('GET', '/api/data/sync');
  const updatedAlarm = syncAlarm2.cellAlarms.find(a => a.id === alarm.id);
  console.log('  Device C sees checked alarm:', updatedAlarm?.checked === true ? '✅ YES' : '❌ NO');
  console.log('  ✅ CELL ALARM SYNC TEST COMPLETE\n');

  // Test 5: DAILY TASKS
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 5: DAILY TASKS SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const task = {
    id: 'task-test-' + Date.now(),
    unitId: 'north',
    date: new Date().toISOString().slice(0, 10),
    label: 'Morning muster',
    done: false
  };
  
  const createTask = await request('POST', '/api/data/tasks', task);
  console.log('  Device A created task:', createTask.label);
  
  const syncTask = await request('GET', '/api/data/sync');
  const foundTask = syncTask.dailyTasks.find(t => t.id === task.id);
  console.log('  Device B sees task:', foundTask ? '✅ YES' : '❌ NO');
  
  // Update task
  const updateTask = await request('PUT', `/api/data/tasks/${task.id}`, { ...task, done: true });
  console.log('  Device A completed task');
  
  const syncTask2 = await request('GET', '/api/data/sync');
  const updatedTask = syncTask2.dailyTasks.find(t => t.id === task.id);
  console.log('  Device C sees completed task:', updatedTask?.done === true ? '✅ YES' : '❌ NO');
  console.log('  ✅ DAILY TASKS SYNC TEST COMPLETE\n');

  // Test 6: PRISONERS
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST 6: PRISONER SYNC');
  console.log('═══════════════════════════════════════════════════════════');
  
  const prisoner = {
    id: 'prisoner-test-' + Date.now(),
    unitId: 'north',
    name: 'Test Prisoner',
    cell: 'Cell-201',
    location: 'CELL'
  };
  
  const createPrisoner = await request('POST', '/api/data/prisoners', prisoner);
  console.log('  Device A created prisoner:', createPrisoner.name);
  
  const syncPrisoner = await request('GET', '/api/data/sync');
  const foundPrisoner = syncPrisoner.prisoners.find(p => p.id === prisoner.id);
  console.log('  Device B sees prisoner:', foundPrisoner ? '✅ YES' : '❌ NO');
  
  // Update prisoner
  const updatePrisoner = await request('PUT', `/api/data/prisoners/${prisoner.id}`, { ...prisoner, location: 'VISIT' });
  console.log('  Device A moved prisoner to visit');
  
  const syncPrisoner2 = await request('GET', '/api/data/sync');
  const updatedPrisoner = syncPrisoner2.prisoners.find(p => p.id === prisoner.id);
  console.log('  Device C sees location change:', updatedPrisoner?.location === 'VISIT' ? '✅ YES' : '❌ NO');
  console.log('  ✅ PRISONER SYNC TEST COMPLETE\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('            ALL SYNC TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nAll data types should now sync across devices via WebSocket!');
  console.log('Note: Check browser console for WebSocket broadcast messages.');
}

testAllSync().catch(console.error);
