const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Configuratie voor load test
const config = {
  title: 'FibroGuardian Pro Load Test',
  url: process.env.LOAD_TEST_URL || 'http://localhost:3000', // Standaard naar localhost
  connections: parseInt(process.env.LOAD_TEST_CONNECTIONS || '50', 10), // Aantal gelijktijdige verbindingen
  pipelining: parseInt(process.env.LOAD_TEST_PIPELINING || '1', 10),    // Aantal gelijktijdige requests per verbinding
  duration: parseInt(process.env.LOAD_TEST_DURATION || '30', 10),     // Test duur in seconden
  timeout: parseInt(process.env.LOAD_TEST_TIMEOUT || '10', 10), // Timeout per request in seconden
  workers: parseInt(process.env.LOAD_TEST_WORKERS || '1', 10), // Aantal worker threads
  scenarios: [
    {
      name: 'Homepage_GET',
      weight: 20, 
      requests: [ { method: 'GET', path: '/', headers: { 'accept': 'text/html' } } ]
    },
    {
      name: 'PricingPage_GET',
      weight: 10,
      requests: [ { method: 'GET', path: '/pricing', headers: { 'accept': 'text/html' } } ]
    },
    // Voeg hier meer geauthenticeerde scenario's toe zodra auth cookie mechanisme is geïmplementeerd
    // Voorbeeld: Dashboard (vereist authCookie)
    // {
    //   name: 'Dashboard_GET_Auth',
    //   weight: 30,
    //   requests: [ { method: 'GET', path: '/dashboard', headers: { 'accept': 'text/html', 'cookie': '{{ authCookie }}' } } ]
    // },
    // Voorbeeld: API Tasks (vereist authCookie)
    // {
    //   name: 'TasksAPI_GET_Auth',
    //   weight: 25,
    //   requests: [ { method: 'GET', path: '/api/tasks', headers: { 'accept': 'application/json', 'cookie': '{{ authCookie }}' } } ]
    // },
    // Voorbeeld: API Create Task Log (vereist authCookie en randomTaskId)
    // {
    //   name: 'CreateTaskLog_POST_Auth',
    //   weight: 15,
    //   requests: [
    //     {
    //       method: 'POST',
    //       path: '/api/task-logs',
    //       headers: { 'content-type': 'application/json', 'cookie': '{{ authCookie }}' },
    //       body: JSON.stringify({ /* ... mock body ... */ })
    //     }
    //   ]
    // }
  ]
};

// Placeholder voor functies die dynamische data voorbereiden
// Deze moeten door het team worden geïmplementeerd om daadwerkelijke cookies/IDs te verkrijgen.
async function getAuthCookiePlaceholder() {
  console.warn('Placeholder getAuthCookiePlaceholder: Using dummy auth cookie. Implement actual login for realistic tests.');
  // Voorbeeld: return 'sb-access-token=DUMMY_TOKEN; sb-refresh-token=DUMMY_REFRESH_TOKEN;';
  return 'my-dummy-auth-cookie=true;'; 
}

async function getRandomTaskIdsPlaceholder(count = 1) {
  console.warn('Placeholder getRandomTaskIdsPlaceholder: Using dummy task ID. Implement actual task ID fetching.');
  return Array(count).fill('dummy-task-id-for-loadtest');
}

async function runLoadTest() {
  const authCookie = await getAuthCookiePlaceholder();
  const taskIds = await getRandomTaskIdsPlaceholder();
  
  const preparedScenarios = config.scenarios.map(scenario => ({
    ...scenario,
    requests: scenario.requests.map(req => {
      let body = req.body;
      let headers = {...req.headers};
      
      if (headers.cookie && headers.cookie.includes('{{ authCookie }}')) {
        headers.cookie = headers.cookie.replace('{{ authCookie }}', authCookie);
      }
      
      if (body && typeof body === 'string') {
        if (body.includes('{{ randomTaskId }}') && taskIds.length > 0) {
          const randomId = taskIds[Math.floor(Math.random() * taskIds.length)];
          body = body.replace(new RegExp('{{ randomTaskId }}', 'g'), randomId);
        }
      }
      
      return { ...req, headers, body };
    })
  }));
  
  console.log(`Starting load test on ${config.url} with ${config.connections} connections, ${config.pipelining} pipelining, for ${config.duration} seconds using ${config.workers} worker(s).`);
  
  const instance = autocannon({
    ...config, // Spread de hoofdconfiguratie
    scenarios: preparedScenarios, // Gebruik de voorbereide scenario's
  });
  
  autocannon.track(instance, { renderProgressBar: true });
  
  instance.on('done', (results) => {
    console.log('\nLoad test complete.');
    
    const reportDir = path.join(__dirname, '../reports/load-tests');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const reportPath = path.join(reportDir, `load-test-results-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Full report saved to ${reportPath}`);
    
    const { latency, requests, throughput, errors, timeouts } = results;
    console.log(`\n--- Load Test Summary ---`);
    console.log(`Target URL: ${config.url}`);
    console.log(`Duration: ${config.duration}s, Connections: ${config.connections}, Pipelining: ${config.pipelining}, Workers: ${config.workers}`);
    console.log(`\nRequests:`);
    console.log(`  Total: ${requests.total}`);
    console.log(`  Average RPS: ${requests.average.toFixed(2)}`);
    console.log(`  Min RPS: ${requests.min}, Max RPS: ${requests.max}, StdDev: ${requests.stddev.toFixed(2)}`);
    console.log(`\nLatency (ms):`);
    console.log(`  Average: ${latency.average.toFixed(2)}`);
    console.log(`  Min: ${latency.min}, Max: ${latency.max}, StdDev: ${latency.stddev.toFixed(2)}`);
    console.log(`  p50: ${latency.p50.toFixed(2)}, p90: ${latency.p90.toFixed(2)}, p99: ${latency.p99.toFixed(2)}`);
    console.log(`\nThroughput (bytes):`);
    console.log(`  Total: ${(throughput.total / (1024*1024)).toFixed(2)} MB`);
    console.log(`  Average BPS: ${(throughput.average / 1024).toFixed(2)} KB/s`);
    console.log(`\nErrors & Timeouts:`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Timeouts: ${timeouts}`);
    
    // Definieer acceptabele drempels
    const maxAcceptableAvgLatency = 500; // ms
    const minAcceptableRPS = 20; // rps (afhankelijk van verwacht verkeer)
    const maxAcceptableErrorRate = 0.01; // 1%
    const maxAcceptableTimeouts = config.connections * 0.05; // Max 5% timeouts

    let passed = true;
    if (latency.average > maxAcceptableAvgLatency) {
      console.log(`\n❌ FAILED: Average latency (${latency.average.toFixed(2)}ms) exceeds threshold (${maxAcceptableAvgLatency}ms)`);
      passed = false;
    }
    if (requests.average < minAcceptableRPS) {
      console.log(`\n❌ FAILED: Requests per second (${requests.average.toFixed(2)}) below threshold (${minAcceptableRPS})`);
      passed = false;
    }
    const currentErrorRate = errors / requests.total || 0;
    if (currentErrorRate > maxAcceptableErrorRate) {
      console.log(`\n❌ FAILED: Error rate (${(currentErrorRate * 100).toFixed(2)}%) exceeds threshold (${maxAcceptableErrorRate * 100}%)`);
      passed = false;
    }
    if (timeouts > maxAcceptableTimeouts) {
      console.log(`\n❌ FAILED: Timeouts (${timeouts}) exceed threshold (${maxAcceptableTimeouts})`);
      passed = false;
    }
    
    if (passed) {
      console.log('\n✅ Load test PASSED all defined thresholds.');
    } else {
      console.log('\n⚠️ Load test FAILED some defined thresholds. Review report for details.');
      // process.exit(1); // Optioneel: laat script falen in CI
    }
  });

  instance.on('error', (err) => {
    console.error('Autocannon instance error:', err);
  });
}

// Voer de test uit
runLoadTest().catch(err => {
  console.error('Failed to run load test:', err);
  process.exit(1);
});
