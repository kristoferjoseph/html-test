/**
 * Integration tests for CI/CD endpoints
 * Uses Node.js built-in test runner
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the handler
const handlerPath = join(__dirname, '../../handler/index.js');

describe('CI/CD Endpoints', () => {
  test('should handle GET /html-test/results.json with empty results', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test/results.json',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'application/json', 'Should return JSON content type');
    assert.ok(response.headers['Cache-Control'].includes('no-cache'), 'Should disable caching');
    
    const results = JSON.parse(response.body);
    assert.equal(results.status, 'pending', 'Should have pending status initially');
    assert.equal(results.total, 0, 'Should have zero total tests initially');
    assert.equal(results.passed, 0, 'Should have zero passed tests initially');
    assert.equal(results.failed, 0, 'Should have zero failed tests initially');
    assert.ok(Array.isArray(results.files), 'Should have files array');
    assert.ok(Array.isArray(results.tapOutput), 'Should have tapOutput array');
  });

  test('should handle POST /html-test/results.json with valid JSON', async () => {
    const { handler } = await import(handlerPath);
    
    const testResults = {
      status: 'completed',
      total: 5,
      passed: 4,
      failed: 1,
      success: false,
      files: [
        {
          url: '/html-test/file/example.test.html',
          tests: 3,
          passed: 3,
          failed: 0
        },
        {
          url: '/html-test/file/failing.test.html',
          tests: 2,
          passed: 1,
          failed: 1
        }
      ]
    };

    const mockRequest = {
      path: '/html-test/results.json',
      method: 'POST',
      body: JSON.stringify(testResults)
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'application/json', 'Should return JSON content type');
    
    const stored = JSON.parse(response.body);
    assert.equal(stored.status, 'stored', 'Should confirm storage');
    assert.ok(stored.timestamp, 'Should include timestamp');
  });

  test('should handle POST /html-test/results.json with invalid JSON', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test/results.json',
      method: 'POST',
      body: 'invalid json {'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 400, 'Should return 400 for invalid JSON');
    assert.equal(response.headers['Content-Type'], 'application/json', 'Should return JSON content type');
    
    const error = JSON.parse(response.body);
    assert.equal(error.error, 'Invalid JSON', 'Should return error message');
  });

  test('should return stored test results after POST', async () => {
    const { handler } = await import(handlerPath);
    
    // First store results
    const testResults = {
      status: 'completed',
      total: 3,
      passed: 3,
      failed: 0,
      success: true,
      files: [
        {
          url: '/html-test/file/success.test.html',
          tests: 3,
          passed: 3,
          failed: 0
        }
      ]
    };

    await handler({
      path: '/html-test/results.json',
      method: 'POST',
      body: JSON.stringify(testResults)
    });

    // Then retrieve them
    const getResponse = await handler({
      path: '/html-test/results.json',
      method: 'GET'
    });

    assert.equal(getResponse.statusCode, 200, 'Should return 200 status');
    
    const retrieved = JSON.parse(getResponse.body);
    assert.equal(retrieved.status, 'completed', 'Should return stored status');
    assert.equal(retrieved.total, 3, 'Should return stored total');
    assert.equal(retrieved.passed, 3, 'Should return stored passed count');
    assert.equal(retrieved.failed, 0, 'Should return stored failed count');
    assert.equal(retrieved.success, true, 'Should return stored success flag');
    assert.ok(retrieved.timestamp, 'Should have timestamp');
    assert.equal(retrieved.files.length, 1, 'Should return stored files');
  });

  test('should handle GET /html-test/results.tap with empty results', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test/results.tap',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'text/plain', 'Should return plain text content type');
    assert.ok(response.headers['Cache-Control'].includes('no-cache'), 'Should disable caching');
    
    assert.ok(response.body.includes('TAP version 13'), 'Should include TAP version');
    assert.ok(response.body.includes('No test results'), 'Should indicate no results available');
  });

  test('should handle POST /html-test/results.tap with TAP output', async () => {
    const { handler } = await import(handlerPath);
    
    const tapOutput = `TAP version 13
1..3
ok 1 - should have main element
ok 2 - should have correct title
not ok 3 - should be visible
  ---
  message: "Expected element to be visible"
  severity: fail
  ---
# FAIL 1/3`;

    const mockRequest = {
      path: '/html-test/results.tap',
      method: 'POST',
      body: tapOutput
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'text/plain', 'Should return plain text content type');
    assert.equal(response.body, 'TAP results stored', 'Should confirm storage');
  });

  test('should return stored TAP output after POST', async () => {
    const { handler } = await import(handlerPath);
    
    const tapOutput = `TAP version 13
1..2
ok 1 - first test
ok 2 - second test
# PASS 2/2`;

    // First store TAP output
    await handler({
      path: '/html-test/results.tap',
      method: 'POST',
      body: tapOutput
    });

    // Then retrieve it
    const getResponse = await handler({
      path: '/html-test/results.tap',
      method: 'GET'
    });

    assert.equal(getResponse.statusCode, 200, 'Should return 200 status');
    assert.ok(getResponse.body.includes('TAP version 13'), 'Should include TAP version');
    assert.ok(getResponse.body.includes('ok 1 - first test'), 'Should include first test');
    assert.ok(getResponse.body.includes('ok 2 - second test'), 'Should include second test');
    assert.ok(getResponse.body.includes('# PASS 2/2'), 'Should include pass summary');
  });

  test('should handle CI/CD workflow integration pattern', async () => {
    const { handler } = await import(handlerPath);
    
    // Simulate a complete CI/CD workflow
    const testResults = {
      status: 'completed',
      total: 4,
      passed: 3,
      failed: 1,
      success: false,
      files: [
        {
          url: '/html-test/file/component.test.html',
          tests: 2,
          passed: 2,
          failed: 0
        },
        {
          url: '/html-test/file/integration.test.html',
          tests: 2,
          passed: 1,
          failed: 1
        }
      ]
    };

    const tapOutput = `TAP version 13
1..4
ok 1 - component should render
ok 2 - component should handle events
ok 3 - integration should load data
not ok 4 - integration should handle errors
  ---
  message: "Expected error handler to be called"
  severity: fail
  ---
# FAIL 1/4`;

    // Store JSON results
    const jsonResponse = await handler({
      path: '/html-test/results.json',
      method: 'POST',
      body: JSON.stringify(testResults)
    });
    
    assert.equal(jsonResponse.statusCode, 200, 'JSON storage should succeed');

    // Store TAP output
    const tapResponse = await handler({
      path: '/html-test/results.tap',
      method: 'POST',
      body: tapOutput
    });
    
    assert.equal(tapResponse.statusCode, 200, 'TAP storage should succeed');

    // Retrieve JSON results (for CI system processing)
    const getJsonResponse = await handler({
      path: '/html-test/results.json',
      method: 'GET'
    });
    
    const results = JSON.parse(getJsonResponse.body);
    assert.equal(results.success, false, 'Should indicate test failure');
    assert.equal(results.failed, 1, 'Should show failed test count');

    // Retrieve TAP output (for detailed CI logs)
    const getTapResponse = await handler({
      path: '/html-test/results.tap',
      method: 'GET'
    });
    
    assert.ok(getTapResponse.body.includes('not ok 4'), 'Should include failed test in TAP output');
    assert.ok(getTapResponse.body.includes('# FAIL 1/4'), 'Should include failure summary');
  });

  test('should handle empty POST body gracefully', async () => {
    const { handler } = await import(handlerPath);
    
    // Test empty JSON POST
    const jsonResponse = await handler({
      path: '/html-test/results.json',
      method: 'POST',
      body: ''
    });
    
    assert.equal(jsonResponse.statusCode, 200, 'Should handle empty JSON body');

    // Test empty TAP POST
    const tapResponse = await handler({
      path: '/html-test/results.tap',
      method: 'POST',
      body: ''
    });
    
    assert.equal(tapResponse.statusCode, 200, 'Should handle empty TAP body');
  });

  test('should maintain separate result storage for JSON and TAP', async () => {
    const { handler } = await import(handlerPath);
    
    // Store different data in JSON vs TAP
    await handler({
      path: '/html-test/results.json',
      method: 'POST',
      body: JSON.stringify({ total: 5, passed: 5 })
    });

    await handler({
      path: '/html-test/results.tap',
      method: 'POST',
      body: 'TAP version 13\n1..2\nok 1\nok 2'
    });

    // Verify JSON results
    const jsonResponse = await handler({
      path: '/html-test/results.json',
      method: 'GET'
    });
    
    const jsonData = JSON.parse(jsonResponse.body);
    assert.equal(jsonData.total, 5, 'JSON should maintain its own data');

    // Verify TAP results
    const tapResponse = await handler({
      path: '/html-test/results.tap',
      method: 'GET'
    });
    
    assert.ok(tapResponse.body.includes('1..2'), 'TAP should maintain its own data');
  });
});