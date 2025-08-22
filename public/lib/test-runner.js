import { TAPReporter } from '../modules/tap-reporter.js';
import { BrowserAssertions } from './browser-assertions.js';
import { TestConfig } from './test-config.js';

/**
 * Generalized Test Runner
 * Loads and executes tests from configured HTML files
 */

export class TestRunner {
  constructor(config = null) {
    this.config = config || new TestConfig();
    this.reporter = new TAPReporter();
    this.assertions = new BrowserAssertions();
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      files: []
    };
    this.isRunning = false;
  }

  async loadTestFile(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load test file: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return this.parseTestFile(html, url);
    } catch (error) {
      console.error(`Error loading test file ${url}:`, error);
      return {
        url,
        error: error.message,
        tests: []
      };
    }
  }

  parseTestFile(html, url) {
    // Create a temporary iframe to safely parse and execute test HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = 'allow-scripts';

    return new Promise((resolve) => {
      iframe.onload = () => {
        try {
          const tests = this.extractTestsFromIframe(iframe, url);
          document.body.removeChild(iframe);
          resolve({
            url,
            tests,
            error: null
          });
        } catch (error) {
          document.body.removeChild(iframe);
          resolve({
            url,
            tests: [],
            error: error.message
          });
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        resolve({
          url,
          tests: [],
          error: 'Failed to load iframe'
        });
      };

      document.body.appendChild(iframe);
      iframe.srcdoc = this.injectTestRuntime(html);
    });
  }

  injectTestRuntime(html) {
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = this.sanitizeHTML(html);
    
    // Inject our test runtime into the HTML
    const runtimeScript = `
      <script type="module">
        import { BrowserAssertions } from '${window.location.origin}/_static/lib/browser-assertions.js';
        window.__testRuntime = {
          assertions: new BrowserAssertions(),
          tests: [],
          test: function(name, fn) {
            this.tests.push({ name, fn });
          }
        };

        // Expose test function globally
        window.test = window.__testRuntime.test.bind(window.__testRuntime);
        window.assert = window.__testRuntime.assertions;
      </script>
    `;

    // Insert runtime script before any existing scripts
    return sanitizedHtml.replace(/<head>/i, `<head>${runtimeScript}`);
  }

  sanitizeHTML(html) {
    // Use DOMParser for proper HTML parsing and sanitization
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove all potentially dangerous elements
    doc.querySelectorAll('script, iframe, object, embed, applet, form').forEach(el => el.remove());
    
    // Remove all event handler attributes and javascript: URLs
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || 
            attr.value.includes('javascript:') || 
            attr.value.includes('data:') ||
            attr.value.includes('vbscript:')) {
          el.removeAttribute(attr.name);
        }
      });
      
      // Remove dangerous style attributes that could contain expressions
      if (el.hasAttribute('style')) {
        const style = el.getAttribute('style');
        if (style.includes('expression') || style.includes('javascript:') || style.includes('vbscript:')) {
          el.removeAttribute('style');
        }
      }
    });
    
    // Return only the body content to avoid full document structure
    return doc.body ? doc.body.innerHTML : '';
  }

  extractTestsFromIframe(iframe, url) {
    const iframeWindow = iframe.contentWindow;
    const runtime = iframeWindow.__testRuntime;

    if (!runtime) {
      throw new Error('Test runtime not found in iframe');
    }

    return runtime.tests.map(test => ({
      name: test.name,
      fn: test.fn,
      url,
      iframe: iframe.contentDocument
    }));
  }

  async runTest(test, testNumber) {
    const startTime = performance.now();

    try {
      // Create a test context with iframe document without global manipulation
      const testContext = {
        document: test.iframe,
        window: test.iframe.defaultView || window,
        assert: this.assertions
      };

      // Run the test function with proper context binding
      if (test.fn.constructor.name === 'AsyncFunction') {
        await test.fn.call(testContext);
      } else {
        test.fn.call(testContext);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      this.testResults.passed++;
      this.reporter.pass(testNumber, `${test.name} (${test.url})`, duration);

      return { success: true, duration };
    } catch (error) {
      this.testResults.failed++;
      this.reporter.fail(testNumber, `${test.name} (${test.url})`, error);

      return { success: false, error };
    }
  }

  async runAllTests() {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.testResults = { total: 0, passed: 0, failed: 0, files: [] };

    try {
      // Load all test files
      const testUrls = this.config.resolveTestFiles();
      if (testUrls.length === 0) {
        throw new Error('No test files configured');
      }

      console.log(`Loading ${testUrls.length} test files...`);

      const testFiles = await Promise.all(
        testUrls.map(url => this.loadTestFile(url))
      );

      // Collect all tests
      const allTests = [];
      for (const file of testFiles) {
        if (file.error) {
          console.error(`Failed to load ${file.url}: ${file.error}`);
          continue;
        }

        for (const test of file.tests) {
          allTests.push(test);
        }

        this.testResults.files.push(file);
      }

      if (allTests.length === 0) {
        throw new Error('No tests found in configured files');
      }

      this.testResults.total = allTests.length;
      this.reporter.start(this.testResults.total);

      // Run all tests
      for (let i = 0; i < allTests.length; i++) {
        const test = allTests[i];
        const testNumber = i + 1;

        await this.runTest(test, testNumber);
      }

      this.reporter.finish(this.testResults.passed, this.testResults.failed);

      return {
        success: this.testResults.failed === 0,
        ...this.testResults
      };

    } finally {
      this.isRunning = false;
    }
  }

  // Configuration helpers
  addTestFile(url) {
    const files = this.config.get('testFiles');
    files.push(url);
    this.config.set('testFiles', files);
    return this;
  }

  setRemoteBase(baseUrl) {
    this.config.set('remoteBaseUrl', baseUrl);
    return this;
  }

  // Event integration
  setupUI() {
    const runButton = document.querySelector(this.config.get('runButtonSelector'));
    const clearButton = document.querySelector(this.config.get('clearButtonSelector'));

    if (runButton) {
      runButton.addEventListener('click', async () => {
        runButton.disabled = true;
        runButton.textContent = 'Running...';

        try {
          await this.runAllTests();
        } finally {
          runButton.disabled = false;
          runButton.textContent = 'Run Tests';
        }
      });
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.reporter.clear();
        const output = document.querySelector(this.config.get('outputSelector'));
        if (output && output.clear) {
          output.clear();
        }
      });
    }

    // Auto-run if configured
    if (this.config.get('autoRun')) {
      this.autoRun();
    }
  }

  async autoRun() {
    document.addEventListener('DOMContentLoaded', async () => {
      const outputSelector = this.config.get('outputSelector');
      if (outputSelector && outputSelector.includes('test-output')) {
        await customElements.whenDefined('test-output');
      }

      await this.runAllTests();
    });
  }
}

// Export convenience function
export function createRunner(config) {
  return new TestRunner(config);
}
