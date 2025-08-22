/**
 * Example Configuration for HTML Test Framework
 * 
 * This shows how end users can configure the test runner
 * to load tests from various sources
 */

import { TestRunner, TestConfig } from '/_static/lib/test-runner.js';

// Example 1: Basic configuration with local test files
const basicConfig = new TestConfig({
  testFiles: [
    '/test/homepage.test.html',
    '/test/contact.test.html',
    '/test/products.test.html'
  ],
  autoRun: true,
  showOutput: true
});

// Example 2: Remote test files
const remoteConfig = new TestConfig({
  remoteBaseUrl: 'https://my-test-server.com/tests/',
  testFiles: [
    'integration/user-flow.test.html',
    'unit/components.test.html'
  ],
  autoRun: false,
  ciMode: true
});

// Example 3: Configuration from JSON in HTML
// <script type="application/json" data-test-config>
// {
//   "testFiles": ["/tests/smoke.test.html"],
//   "autoRun": true,
//   "tapOutput": true
// }
// </script>

// Example 4: Programmatic usage
async function runCustomTests() {
  const config = new TestConfig({
    testFiles: [
      'https://example.com/tests/api.test.html',
      'https://example.com/tests/ui.test.html'
    ],
    testTimeout: 30000,
    componentWaitTimeout: 2000
  });

  const runner = new TestRunner(config);
  
  // Add additional test files dynamically
  runner
    .addTestFile('/local/additional.test.html')
    .setRemoteBase('https://cdn.example.com/tests/');

  // Run tests
  const results = await runner.runAllTests();
  
  if (results.success) {
    console.log(`✅ All ${results.total} tests passed!`);
  } else {
    console.error(`❌ ${results.failed}/${results.total} tests failed`);
    process.exit(1); // For CI environments
  }
}

// Example 5: Auto-setup with UI integration
async function autoSetup() {
  // Load config from DOM element
  const config = await TestConfig.fromElement();
  
  // Create runner and setup UI
  const runner = new TestRunner(config);
  runner.setupUI(); // Automatically wires up buttons and auto-run
}

export {
  basicConfig,
  remoteConfig,
  runCustomTests,
  autoSetup
};