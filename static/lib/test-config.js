/**
 * Test Configuration System
 * Allows users to configure test file locations and runner behavior
 */

export class TestConfig {
  constructor(options = {}) {
    this.config = {
      // Test file locations
      testFiles: options.testFiles || [],
      testDirectory: options.testDirectory || '/test',
      testPattern: options.testPattern || '**/*.test.html',

      // Remote test sources
      remoteBaseUrl: options.remoteBaseUrl || null,
      testManifest: options.testManifest || null,

      // Runner behavior
      autoRun: options.autoRun !== false, // Default true
      showOutput: options.showOutput !== false, // Default true
      tapOutput: options.tapOutput !== false, // Default true
      exitOnFail: options.exitOnFail !== false, // Default true

      // UI configuration
      outputSelector: options.outputSelector || '#test-output',
      runButtonSelector: options.runButtonSelector || '#run-tests',
      clearButtonSelector: options.clearButtonSelector || '#clear-output',

      // Timeouts and delays
      componentWaitTimeout: options.componentWaitTimeout || 5000,
      testTimeout: options.testTimeout || 10000,

      // CI/CD integration
      ciMode: options.ciMode || false,
      reportFile: options.reportFile || null
    };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    return this;
  }

  merge(options) {
    Object.assign(this.config, options);
    return this;
  }

  // Load configuration from various sources
  static async fromElement(selector = 'script[type="application/json"][data-test-config]') {
    const configElement = document.querySelector(selector);
    if (!configElement) {
      return new TestConfig();
    }

    try {
      const config = JSON.parse(configElement.textContent);
      return new TestConfig(config);
    } catch (error) {
      console.warn('Failed to parse test configuration:', error);
      return new TestConfig();
    }
  }

  static async fromUrl(url) {
    try {
      const response = await fetch(url);
      const config = await response.json();
      return new TestConfig(config);
    } catch (error) {
      console.warn('Failed to load test configuration from URL:', error);
      return new TestConfig();
    }
  }

  static fromWindow(globalVar = 'TEST_CONFIG') {
    const config = window[globalVar];
    return new TestConfig(config || {});
  }

  // Resolve test file URLs
  resolveTestFiles() {
    const files = [];

    // Add explicitly configured test files
    for (const file of this.config.testFiles) {
      files.push(this.resolveTestUrl(file));
    }

    return files;
  }

  resolveTestUrl(path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (this.config.remoteBaseUrl) {
      return new URL(path, this.config.remoteBaseUrl).href;
    }

    // Relative to current origin
    return new URL(path, window.location.origin).href;
  }

  // Validation
  validate() {
    const errors = [];

    if (this.config.testFiles.length === 0 && !this.config.testManifest) {
      errors.push('No test files configured. Set testFiles or testManifest.');
    }

    if (this.config.componentWaitTimeout < 0) {
      errors.push('componentWaitTimeout must be >= 0');
    }

    if (this.config.testTimeout < 0) {
      errors.push('testTimeout must be >= 0');
    }

    return errors;
  }

  // Export configuration for debugging
  toJSON() {
    return JSON.stringify(this.config, null, 2);
  }
}

// Default singleton instance
export const testConfig = new TestConfig();
