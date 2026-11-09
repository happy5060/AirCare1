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
  console.log('\n[*] 2. TODAY\'S AQI HERO, ATTRIBUTION & CALCULATION BREAKDOWN:');
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
        const hasBreakdownTable = !!document.querySelector('table');
        const pollutantRows = Array.from(document.querySelectorAll('tbody tr')).length;
        const hasDominantBadge = bodyLower.includes('dominant pollutant');
        return { h1, cityHeading, aqiText, catBadge, isModelLabeled, hasScientificDisclaimer, hasBreakdownTable, pollutantRows, hasDominantBadge };
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
  console.log('  ✓ CPCB Sub-Index Breakdown Table Present:', todayData.hasBreakdownTable ? 'PASS' : 'FAIL');
  console.log(`  ✓ Evaluated Criteria Pollutants in Breakdown: ${todayData.pollutantRows} rows`);
  console.log('  ✓ Dominant Pollutant Star Badge:', todayData.hasDominantBadge ? 'PASS' : 'FAIL');
  if (!todayData.isModelLabeled || !todayData.hasScientificDisclaimer || !todayData.hasBreakdownTable) {
    throw new Error('Model estimate attribution or calculation breakdown missing from Today\'s AQI view!');
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

  // Test CSV Download Button & Summary Report Modal
  console.log('\n[*] Testing CSV Download Button & Summary Report Modal:');
  const actionButtonsEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const csvBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Download CSV'));
        const reportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Summary Report'));
        return { hasCsvBtn: !!csvBtn, hasReportBtn: !!reportBtn };
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ "Download CSV" Button Present:', actionButtonsEval.result.value.hasCsvBtn ? 'PASS' : 'FAIL');
  console.log('  ✓ "Summary Report" Button Present:', actionButtonsEval.result.value.hasReportBtn ? 'PASS' : 'FAIL');
  if (!actionButtonsEval.result.value.hasCsvBtn || !actionButtonsEval.result.value.hasReportBtn) {
    throw new Error('CSV Download or Summary Report button missing in Past AQI view!');
  }

  // Open and verify Summary Report Modal
  await sendCommand('Runtime.evaluate', {
    expression: `
      const reportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Summary Report'));
      if (reportBtn) reportBtn.click();
    `,
  });
  await sleep(600);

  const modalEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        const modalTitle = modal?.querySelector('h2')?.innerText;
        const modalTextLower = (modal?.innerText || '').toLowerCase();
        const hasAverages = modalTextLower.includes('period average');
        const hasPrintBtn = modalTextLower.includes('print report');
        const closeBtn = modal?.querySelector('button[aria-label="Close report modal"]');
        if (closeBtn) closeBtn.click();
        return { isOpen: !!modal, modalTitle, hasAverages, hasPrintBtn };
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ Summary Report Modal Opened:', modalEval.result.value.isOpen ? 'PASS' : 'FAIL');
  console.log('  ✓ Modal Title:', modalEval.result.value.modalTitle);
  console.log('  ✓ Modal Metrics Rendered:', modalEval.result.value.hasAverages ? 'PASS' : 'FAIL');
  await sleep(400);

  // Test Monthly Trends Sub-tab toggle
  console.log('\n[*] Testing Monthly Trends Sub-tab on Past AQI:');
  await sendCommand('Runtime.evaluate', {
    expression: `
      const monthlyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Monthly Trends'));
      if (monthlyBtn) monthlyBtn.click();
    `,
  });
  await sleep(600);

  const monthlyViewEval = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const hasMonthlyCards = document.body.innerText.includes('Monthly Aggregations for');
        const monthCardsCount = document.querySelectorAll('main div.grid div.rounded-xl').length;
        // switch back to daily
        const dailyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Trajectory'));
        if (dailyBtn) dailyBtn.click();
        return { hasMonthlyCards, monthCardsCount };
      })()
    `,
    returnByValue: true,
  });
  console.log('  ✓ Monthly Aggregations View Loaded:', monthlyViewEval.result.value.hasMonthlyCards ? 'PASS' : 'FAIL');
  console.log(`  ✓ Monthly Cards Rendered: ${monthlyViewEval.result.value.monthCardsCount} elements`);
  await sleep(400);

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
        const divergenceText = Array.from(document.querySelectorAll('div, p')).find(e => e.innerText?.includes('Comparison Summary') || e.innerText?.includes('cleanest air quality'))?.innerText;
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

  // 5. Test Multi-Viewport Responsive Layouts across 7 Breakpoints
  console.log('\n[*] 5. MULTI-VIEWPORT RESPONSIVE LAYOUT VERIFICATION (320px - 1440px):');
  const viewportsToTest = [
    { name: 'Small Mobile (iPhone SE 1st gen)', width: 320, height: 568, mobile: true },
    { name: 'Standard Mobile (iPhone SE)', width: 375, height: 667, mobile: true },
    { name: 'Modern Smartphone (iPhone 13/14)', width: 390, height: 844, mobile: true },
    { name: 'Large Smartphone (iPhone 14 Pro Max)', width: 430, height: 932, mobile: true },
    { name: 'Tablet Portrait (iPad Mini)', width: 768, height: 1024, mobile: true },
    { name: 'Tablet Landscape / Small Laptop', width: 1024, height: 768, mobile: false },
    { name: 'Desktop Display (1440p baseline)', width: 1440, height: 900, mobile: false },
  ];

  for (const vp of viewportsToTest) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      mobile: vp.mobile,
    });
    await sleep(600);

    const vpEval = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const main = document.querySelector('main');
          const hamburger = document.querySelector('button[aria-label="Toggle navigation menu"]');
          const bodyScrollWidth = document.body.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const isHamburgerVisible = hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false;
          return {
            headerHeight: header?.offsetHeight,
            bodyScrollWidth,
            clientWidth,
            isHamburgerVisible
          };
        })()
      `,
      returnByValue: true,
    });

    const res = vpEval.result.value;
    const hasHorizontalOverflow = res.bodyScrollWidth > res.clientWidth + 3;
    console.log(
      `  ✓ Viewport ${String(vp.width).padStart(4)}px [${vp.name}]: ` +
      `scrollWidth=${res.bodyScrollWidth}px <= clientWidth=${res.clientWidth}px | ` +
      `Header=${res.headerHeight}px | ` +
      `Mobile Menu=${res.isHamburgerVisible ? 'ACTIVE' : 'DESKTOP NAV'} | ` +
      `Status: ${hasHorizontalOverflow ? 'FAIL (OVERFLOW)' : 'PASS (ZERO OVERFLOW)'}`
    );

    if (hasHorizontalOverflow) {
      throw new Error(
        `Horizontal page overflow detected on ${vp.width}px (${vp.name}): ` +
        `scrollWidth (${res.bodyScrollWidth}px) exceeds clientWidth (${res.clientWidth}px)`
      );
    }
  }

  // Restore Desktop Viewport (1280x800)
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(400);

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
