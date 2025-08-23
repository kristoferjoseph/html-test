/**
 * Main JavaScript for HTML Test Plugin
 * Handles test discovery, execution, and CI/CD integration
 */

import { TestRunner, TestConfig } from '/html-test/static/lib/test-runner.js';
import '/html-test/static/components/test-output.js';

class PluginTestRunner {
  constructor() {
    this.testFiles = [];
    this.results = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      files: [],
      tapOutput: []
    };
  }

  async init() {
    await customElements.whenDefined('test-output');
    this.setupEventListeners();
    await this.discoverTestFiles();
  }

  setupEventListeners() {
    const runAllButton = document.getElementById('run-all-tests');
    const clearButton = document.getElementById('clear-output');

    runAllButton?.addEventListener('click', () => this.runAllTests());
    clearButton?.addEventListener('click', () => this.clearOutput());

    // Listen for TAP output from test runner
    document.addEventListener('tap-output', (event) => {
      this.results.tapOutput.push(event.detail.line);
    });

    document.addEventListener('tap-finish', (event) => {
      this.updateResults(event.detail);
    });
  }

  async discoverTestFiles() {
    // Get test files from the page (server-rendered)
    const testFileElements = document.querySelectorAll('.test-file-link');
    this.testFiles = Array.from(testFileElements).map(el => ({
      name: el.textContent,
      url: el.href,
      path: el.nextElementSibling?.textContent || el.href
    }));

    console.log(`Discovered ${this.testFiles.length} test files`);
  }

  async runAllTests() {
    if (this.testFiles.length === 0) {
      console.log('No test files to run');
      return;
    }

    const runButton = document.getElementById('run-all-tests');
    runButton.disabled = true;
    runButton.textContent = 'Running...';

    try {
      // Create test runner configuration
      const config = new TestConfig({
        testFiles: this.testFiles.map(f => f.url),
        autoRun: false,
        ciMode: true
      });

      const runner = new TestRunner(config);
      
      // Run all tests
      const results = await runner.runAllTests();
      
      // Update plugin results
      this.updateResults(results);
      
      // Send results to CI/CD endpoints
      await this.sendResultsToCI();

    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      runButton.disabled = false;
      runButton.textContent = 'Run All Tests';
    }
  }

  updateResults(testResults) {
    this.results = {
      ...this.results,
      timestamp: new Date().toISOString(),
      total: testResults.total || 0,
      passed: testResults.passed || 0,
      failed: testResults.failed || 0,
      success: testResults.success || false,
      files: testResults.files || []
    };

    console.log('Test results updated:', this.results);
  }

  async sendResultsToCI() {
    try {
      // Send JSON results
      const jsonResponse = await fetch('/html-test/results.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.results)
      });

      // Send TAP results  
      const tapResponse = await fetch('/html-test/results.tap', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: this.results.tapOutput.join('\\n')
      });

      console.log('Results sent to CI/CD endpoints');
    } catch (error) {
      console.error('Error sending results to CI:', error);
    }
  }

  clearOutput() {
    const output = document.getElementById('test-output');
    output?.clear();
    
    // Reset results
    this.results = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      files: [],
      tapOutput: []
    };
  }
}

// Initialize plugin when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const pluginRunner = new PluginTestRunner();
  await pluginRunner.init();
  
  // Make available globally for debugging
  window.pluginTestRunner = pluginRunner;
});