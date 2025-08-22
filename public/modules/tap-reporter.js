'use strict';

export class TAPReporter {
  constructor() {
    this.output = [];
    this.testCount = 0;
  }

  start(totalTests) {
    this.testCount = totalTests;
    const tapVersion = 'TAP version 13';
    const plan = `1..${totalTests}`;
    
    this.writeOutput(tapVersion);
    this.writeOutput(plan);
    
    this.dispatchEvent('tap-start', { totalTests });
  }

  pass(testNumber, testName, duration = null) {
    const line = `ok ${testNumber} - ${testName}`;
    this.writeOutput(line);
    
    if (duration !== null) {
      this.writeOutput(`  ---`);
      this.writeOutput(`  duration_ms: ${duration.toFixed(2)}`);
      this.writeOutput(`  ...`);
    }
    
    this.dispatchEvent('tap-pass', { testNumber, testName, duration });
  }

  fail(testNumber, testName, error) {
    const line = `not ok ${testNumber} - ${testName}`;
    this.writeOutput(line);
    
    this.writeOutput(`  ---`);
    this.writeOutput(`  message: "${error.message}"`);
    this.writeOutput(`  severity: fail`);
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 4);
      this.writeOutput(`  stack: |`);
      stackLines.forEach(stackLine => {
        this.writeOutput(`    ${stackLine.trim()}`);
      });
    }
    
    this.writeOutput(`  ...`);
    
    this.dispatchEvent('tap-fail', { testNumber, testName, error: error.message });
  }

  finish(passedTests, failedTests) {
    const totalTests = passedTests + failedTests;
    
    if (failedTests > 0) {
      this.writeOutput(`# FAIL ${failedTests}/${totalTests}`);
    } else {
      this.writeOutput(`# PASS ${passedTests}/${totalTests}`);
    }
    
    this.dispatchEvent('tap-finish', { 
      passedTests, 
      failedTests, 
      totalTests,
      success: failedTests === 0 
    });
  }

  writeOutput(line) {
    console.log(line);
    this.output.push(line);
    
    this.dispatchEvent('tap-output', { line });
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  getOutput() {
    return this.output.join('\n');
  }

  clear() {
    this.output = [];
    this.testCount = 0;
  }
}