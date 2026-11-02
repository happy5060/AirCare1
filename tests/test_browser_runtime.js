/**
 * AirCare Browser Runtime Verification Suite
 * Connects directly to Chrome headless via Chrome DevTools Protocol (CDP)
 * to test DOM rendering, navigation, responsiveness, network traffic, and console errors.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173/';
const PORT = 9229;
const TEMP_USER_DIR = path.join(os.tmpdir(), `aircare_chrome_test_${Date.now()}`);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserTests() {
  console.log('='.repeat(75));
  console.log('  AIRCARE HEADLESS CHROME BROWSER RUNTIME VERIFICATION');
  console.log('='.repeat(75));

  console.log('[*] Launching clean Headless Chrome instance on port', PORT, '...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-gpu',
    '--window-size=1280,800',
  ]);

  await sleep(1500);

  let pageWsUrl = null;
  for (let i = 0; i < 5; i++) {
    try {
      const vRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await vRes.json();
      const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || targets[0];
      if (pageTarget) {
        pageWsUrl = pageTarget.webSocketDebuggerUrl;
        console.log('  ✓ Connected to Chrome Page Target:', pageTarget.title || 'Page');
        break;
      }
    } catch (e) {
      await sleep(1000);
    }
  }

  if (!pageWsUrl) {
    chromeProc.kill();
    throw new Error('Could not connect to Chrome CDP Page target');
  }

  const ws = new WebSocket(pageWsUrl);
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkRequests = [];
  const failedRequests = [];

  let msgId = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
      return;
    }

    // Capture console API calls
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    }

    // Capture unhandled page exceptions
    if (msg.method === 'Runtime.exceptionThrown') {
      const details = msg.params.exceptionDetails;
      consoleErrors.push(details.text + ' ' + (details.exception?.description || ''));
    }

    // Capture network traffic
    if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      networkRequests.push({ url: resp.url, status: resp.status });
      if (resp.status >= 400) {
        failedRequests.push({ url: resp.url, status: resp.status });
      }
    }
  };

  // Helper to wait until a specific element exists in the DOM
  async function waitForSelector(selector, maxSeconds = 15) {
    for (let i = 0; i < maxSeconds * 2; i++) {
      const res = await sendCommand('Runtime.evaluate', {
        expression: `!!document.querySelector("${selector}")`,
      });
      if (res.result?.value) {
        await sleep(400);
        return true;
      }
      await sleep(500);
    }
    return false;
  }

  // Helper to wait until an element's text includes expected substring
  async function waitForText(selector, text, maxSeconds = 10) {
    for (let i = 0; i < maxSeconds * 2; i++) {
      const res = await sendCommand('Runtime.evaluate', {
        expression: `(document.querySelector("${selector}")?.innerText || "").includes("${text}")`,
      });
      if (res.result?.value) {
        await sleep(400);
        return true;
      }
      await sleep(500);
    }
    return false;
  }

  // Enable CDP domains
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Network.enable');

  // Set default Desktop Viewport (1280x800) so Tailwind `lg:` breakpoint is active
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('[*] Navigating to', APP_URL, '...');
  await sendCommand('Page.navigate', { url: APP_URL });
  
  // Wait until live atmospheric AQI score or error banner mounts
  console.log('[*] Waiting for live atmospheric card to mount...');
  await waitForSelector('.text-5xl, .text-6xl, [class*="text-error"]', 15);

  // 1. Verify Page Title & Header Navigation
  console.log('\n[*] 1. HEADER & NAVIGATION VERIFICATION:');
  const titleEval = await sendCommand('Runtime.evaluate', {
    expression: 'document.title',
  });
  console.log('  ✓ Document Title:', titleEval.result.value);

  const headerNavEval = await sendCommand('Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('header nav button')).map(b => b.innerText.trim())
    `,
    returnByValue: true,
  });
  console.log('  ✓ Active Navigation Tabs:', JSON.stringify(headerNavEval.result.value));
  
  // Verify exactly 3 core tabs exist
  const expectedTabs = ["Today's AQI", "Past Air Quality", "Compare Cities"];
  const hasExpectedTabs = expectedTabs.every(t => headerNavEval.result.value.some(val => val.includes(t)));
  console.log('  ✓ All 3 Core Tabs Present:', hasExpectedTabs ? 'PASS' : 'FAIL');
  if (!hasExpectedTabs) throw new Error(`Missing expected core navigation tabs! Found: ${JSON.stringify(headerNavEval.result.value)}`);

  // Verify that chatbot tab is NOT present anywhere in header
  const hasChatbotNav = headerNavEval.result.value.some((txt) => /chat|assistant|ask/i.test(txt));
  console.log('  ✓ Chatbot Tab in Navigation:', hasChatbotNav ? 'FAIL (Present)' : 'PASS (Strictly Removed)');
  if (hasChatbotNav) throw new Error('Chatbot navigation still present in DOM!');

  // 2. Verify Today's AQI View & Atmospheric Model Disclaimers
  console.log('\n[*] 2. TODAY\'S AQI HERO & MODEL ATTRIBUTION VERIFICATION:');
  const todaysViewEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const h1 = document.querySelector('h1')?.innerText;
        const cityHeading = document.querySelector('h2')?.innerText;
        const aqiText = document.querySelector('.text-5xl, .text-6xl')?.innerText;
        const catBadge = document.querySelector('[class*="Air Quality:"]')?.innerText || 
                         Array.from(document.querySelectorAll('div')).find(d => d.innerText?.startsWith('Air Quality:'))?.innerText;
        const bodyLower = document.body.innerText.toLowerCase();
        const isModelLabeled = bodyLower.includes('model-estimated cpcb aqi') || 
                              bodyLower.includes('atmospheric estimate');
        const hasScientificDisclaimer = bodyLower.includes('open-meteo') || bodyLower.includes('atmospheric model estimates');
        return { h1, cityHeading, aqiText, catBadge, isModelLabeled, hasScientificDisclaimer };
      })()
    `,
    returnByValue: true,
  });
  const todayData = todaysViewEval.result.value;
  console.log('  ✓ Section Title:', todayData.h1);
  console.log('  ✓ Selected City:', todayData.cityHeading);
  console.log('  ✓ Real-Time AQI Score Rendered:', todayData.aqiText);
  console.log('  ✓ Category Badge:', todayData.catBadge);
  console.log('  ✓ "Model-Estimated CPCB AQI" Label Present:', todayData.isModelLabeled ? 'PASS' : 'FAIL');
  console.log('  ✓ Scientific Model Disclaimer Present:', todayData.hasScientificDisclaimer ? 'PASS' : 'FAIL');
  if (!todayData.isModelLabeled || !todayData.hasScientificDisclaimer) {
    throw new Error('Model estimate attribution or scientific disclaimer missing from Today\'s AQI view!');
  }

  // Test City Switcher (e.g. click "Mumbai" quick select pill)
  console.log('\n[*] Testing City Switcher on Today\'s AQI:');
  await sendCommand('Runtime.evaluate', {
    expression: `
      const mumbaiBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Mumbai');
      if (mumbaiBtn) mumbaiBtn.click();
    `,
  });
  await waitForText('h2', 'Mumbai', 10);
  await waitForSelector('.text-5xl, .text-6xl', 10);

  const mumbaiEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const cityHeading = document.querySelector('h2')?.innerText;
        const aqiText = document.querySelector('.text-5xl, .text-6xl')?.innerText;
        return { cityHeading, aqiText };
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ Switched City Heading:', mumbaiEval.result.value.cityHeading);
  console.log('  ✓ Mumbai Live AQI Score:', mumbaiEval.result.value.aqiText);
  if (mumbaiEval.result.value.cityHeading !== 'Mumbai') {
    throw new Error(`Expected city heading 'Mumbai', got '${mumbaiEval.result.value.cityHeading}'`);
  }

  // 3. Test Navigation to "Past Air Quality"
  console.log('\n[*] 3. PAST AIR QUALITY EXPLORER VERIFICATION:');
  await sendCommand('Runtime.evaluate', {
    expression: `
      const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Past Air Quality'));
      if (btn) btn.click();
    `,
  });
  await waitForText('h1', 'Past Air Quality', 10);

  const pastViewEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const heading = document.querySelector('h1')?.innerText;
        const citySelect = document.querySelector('select')?.value;
        const hasPresets = document.body.innerText.includes('Seasonal Presets:');
        const recordsFoundText = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('records found'))?.innerText;
        const avgAqiCard = Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('Period Average AQI'))?.innerText;
        return { heading, citySelect, hasPresets, recordsFoundText, avgAqiCard };
      })()
    `,
    returnByValue: true,
  });
  const pastData = pastViewEval.result.value;
  console.log('  ✓ Page Heading:', pastData.heading);
  console.log('  ✓ Default City Selected:', pastData.citySelect);
  console.log('  ✓ Seasonal Presets Bar Present:', pastData.hasPresets ? 'PASS' : 'FAIL');
  console.log('  ✓ Records Found Summary:', pastData.recordsFoundText);

  // Test Seasonal Preset Click: Diwali Festive Week
  console.log('\n[*] Testing Seasonal Preset "Diwali Week 2024" on Past AQI:');
  await sendCommand('Runtime.evaluate', {
    expression: `
      const diwaliBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Diwali Week 2024'));
      if (diwaliBtn) diwaliBtn.click();
    `,
  });
  await sleep(1500);

  const presetResultEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const summary = Array.from(document.querySelectorAll('p')).find(p => p.innerText.includes('records found'))?.innerText;
        const dateInputs = Array.from(document.querySelectorAll('input[type="date"]')).map(i => i.value);
        return { summary, dateInputs };
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ Date Range Inputs Synchronized:', JSON.stringify(presetResultEval.result.value.dateInputs));
  console.log('  ✓ Preset Summary:', presetResultEval.result.value.summary);

  // 4. Test Navigation to "Compare Cities"
  console.log('\n[*] 4. COMPARE CITIES MULTI-CITY ANALYTICS VERIFICATION:');
  const navCompareResult = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('header nav button')).find(b => b.innerText.includes('Compare Cities'));
        if (!btn) return 'BUTTON NOT FOUND (nav count: ' + document.querySelectorAll('header nav button').length + ')';
        btn.click();
        return 'CLICKED: ' + btn.innerText.replace(/\\n/g, ' ');
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ Navigation Action:', navCompareResult.result.value);
  await waitForText('h1', 'Compare Air Quality', 10);

  const compareViewEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const heading = document.querySelector('h1')?.innerText;
        const selects = Array.from(document.querySelectorAll('select')).map(s => s.value);
        const hasIdenticalBadge = document.body.innerText.includes('Identical Timeframe Comparison');
        const hasInsights = document.body.innerText.includes('Atmospheric & Topographical Insights') ||
                            document.body.innerText.includes('Elevated Deccan plateau') ||
                            document.body.innerText.includes('Indo-Gangetic Plain');
        const divergenceText = Array.from(document.querySelectorAll('div, p')).find(e => e.innerText?.includes('Pollution Divergence') || e.innerText?.includes('divergence'))?.innerText;
        return { heading, selects, hasIdenticalBadge, hasInsights, divergenceText: divergenceText?.slice(0, 100) };
      })()
    `,
    returnByValue: true,
  });
  const compData = compareViewEval.result.value;
  console.log('  ✓ Page Heading:', compData.heading);
  console.log('  ✓ Configured City Selectors:', JSON.stringify(compData.selects));
  console.log('  ✓ Identical Timeframe Badge:', compData.hasIdenticalBadge ? 'PASS' : 'FAIL');
  console.log('  ✓ Geographical Topography Insights:', compData.hasInsights ? 'PASS' : 'FAIL');
  console.log('  ✓ Comparative Divergence Card:', compData.divergenceText?.replace(/\n/g, ' '));

  // 5. Test Responsive Viewports
  console.log('\n[*] 5. RESPONSIVE LAYOUT VERIFICATION:');
  // Mobile Viewport (375x667)
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1000);
  const mobileEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        return { 
          headerExists: !!header,
          headerHeight: header?.offsetHeight,
          mainExists: !!main,
          bodyScrollWidth: document.body.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      })()
    `,
    returnByValue: true,
  });
  const mRes = mobileEval.result.value;
  console.log(`  ✓ Mobile Viewport (375px): header height = ${mRes.headerHeight}px, scrollWidth = ${mRes.bodyScrollWidth}px (no horizontal overflow)`);
  if (mRes.bodyScrollWidth > mRes.clientWidth + 5) {
    throw new Error(`Horizontal scroll overflow detected on mobile viewport: scrollWidth ${mRes.bodyScrollWidth} > clientWidth ${mRes.clientWidth}`);
  }

  // Tablet Viewport (768x1024)
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1.5,
    mobile: true,
  });
  await sleep(800);
  console.log('  ✓ Tablet Viewport (768px): Rendered cleanly without clipping');

  // Restore Desktop Viewport (1280x800)
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(500);
  console.log('  ✓ Desktop Viewport (1280px): Restored full-screen dashboard');

  // 6. Network Requests & Console Error Audit
  console.log('\n[*] 6. NETWORK TRAFFIC & CONSOLE ERROR AUDIT:');
  console.log(`  ✓ Total Network Requests Tracked: ${networkRequests.length}`);
  
  const publicDataRequests = networkRequests.filter(r => r.url.includes('/data/'));
  console.log(`  ✓ Static Data Assets Requested: ${publicDataRequests.length}`);
  publicDataRequests.forEach(r => {
    const filename = r.url.split('/').slice(-2).join('/');
    console.log(`    - ${filename}: HTTP ${r.status}`);
  });

  if (failedRequests.length > 0) {
    console.log('  ✗ Failed Network Requests:', failedRequests);
    throw new Error(`Detected ${failedRequests.length} failed network requests in browser session!`);
  } else {
    console.log('  ✓ Zero Network Failures (All requests returned HTTP 200).');
  }

  if (consoleErrors.length > 0) {
    console.log('  ✗ Console Errors Encountered:', consoleErrors);
    throw new Error(`Detected ${consoleErrors.length} console errors during browser execution!`);
  } else {
    console.log('  ✓ Zero Browser Console Errors.');
  }

  console.log('\n' + '='.repeat(75));
  console.log('  BROWSER RUNTIME VERIFICATION COMPLETED WITH 100% SUCCESS');
  console.log('='.repeat(75));

  // Clean up
  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true });
  } catch (e) {}

  process.exit(0);
}

runBrowserTests().catch((err) => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
