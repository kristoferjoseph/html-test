'use strict';

import { TAPReporter } from './tap-reporter.js';
import { assert } from '../lib/browser-assertions.js';

class TestSuite {
  constructor() {
    this.tests = [];
    this.reporter = new TAPReporter();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.currentTest = null;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
    this.totalTests++;
  }

  async run() {
    this.reporter.start(this.totalTests);
    
    for (let i = 0; i < this.tests.length; i++) {
      const { name, testFunction } = this.tests[i];
      const testNumber = i + 1;
      
      this.currentTest = { name, number: testNumber };
      
      try {
        const startTime = performance.now();
        
        if (testFunction.constructor.name === 'AsyncFunction') {
          await testFunction();
        } else {
          testFunction();
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.passedTests++;
        this.reporter.pass(testNumber, name, duration);
        
      } catch (error) {
        this.failedTests++;
        this.reporter.fail(testNumber, name, error);
      }
    }
    
    this.reporter.finish(this.passedTests, this.failedTests);
    return this.failedTests === 0;
  }

  getCurrentTest() {
    return this.currentTest;
  }
}

class TestFramework {
  constructor() {
    this.currentSuite = new TestSuite();
    this.suites = [];
  }

  test(name, testFunction) {
    this.currentSuite.test(name, testFunction);
  }

  async runTests() {
    this.suites.push(this.currentSuite);
    const success = await this.currentSuite.run();
    
    this.dispatchEvent('tests-complete', {
      success,
      totalTests: this.currentSuite.totalTests,
      passedTests: this.currentSuite.passedTests,
      failedTests: this.currentSuite.failedTests
    });
    
    return success;
  }

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  reset() {
    this.currentSuite = new TestSuite();
  }
}

const testFramework = new TestFramework();

export function test(name, testFunction) {
  testFramework.test(name, testFunction);
}

export async function runTests() {
  return await testFramework.runTests();
}

export { assert };
export { testFramework };