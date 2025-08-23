/**
 * Integration tests for HTTP route handlers
 * Uses Node.js built-in test runner
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the handler
const handlerPath = join(__dirname, '../../handler/index.js');

// Create a temporary test directory
const testDir = join(__dirname, '../fixtures/handler-test');

describe('HTTP Route Handler', () => {
  before(async () => {
    // Create test directory and files for handler testing
    await mkdir(testDir, { recursive: true });
    
    await writeFile(join(testDir, 'example.test.html'), `
<!DOCTYPE html>
<html>
<head><title>Example Test</title></head>
<body>
  <div id="app">Test Application</div>
  <script type="module">
    test('should have app element', () => {
      assert.exists('#app');
    });
  </script>
</body>
</html>
    `);
    
    await writeFile(join(testDir, 'form.spec.html'), `
<!DOCTYPE html>
<html>
<head><title>Form Test</title></head>
<body>
  <form id="test-form">
    <input id="name" type="text" required>
    <button type="submit">Submit</button>
  </form>
  <script type="module">
    test('should have form elements', () => {
      assert.exists('#test-form');
      assert.exists('#name');
      assert.hasAttribute('#name', 'required');
    });
  </script>
</body>
</html>
    `);

    // Set environment variables for handler configuration
    process.env.HTML_TEST_DIRECTORY = testDir.replace(process.cwd() + '/', '');
    process.env.HTML_TEST_PATTERNS = '*.test.html,*.spec.html';
  });

  after(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
    delete process.env.HTML_TEST_DIRECTORY;
    delete process.env.HTML_TEST_PATTERNS;
  });

  test('should handle GET /html-test route', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'text/html', 'Should return HTML content type');
    assert.ok(response.body.includes('<!DOCTYPE html>'), 'Should return HTML document');
    assert.ok(response.body.includes('HTML Test Runner'), 'Should include test runner title');
    assert.ok(response.body.includes('example.test.html'), 'Should list discovered test files');
    assert.ok(response.body.includes('form.spec.html'), 'Should list all test files');
  });

  test('should include CSP headers in main route', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.ok(response.headers['Content-Security-Policy'], 'Should include CSP header');
    assert.ok(response.headers['Content-Security-Policy'].includes("default-src 'self'"), 'Should have secure CSP');
    assert.ok(response.headers['Content-Security-Policy'].includes('connect-src'), 'Should allow WebSocket connections');
  });

  test('should handle GET /html-test/file/* route', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test/file/example.test.html',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 200, 'Should return 200 status');
    assert.equal(response.headers['Content-Type'], 'text/html', 'Should return HTML content type');
    assert.ok(response.body.includes('example.test.html'), 'Should reference the test file');
  });

  test('should handle unknown routes with 404', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test/unknown-route',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    assert.equal(response.statusCode, 404, 'Should return 404 for unknown routes');
    assert.equal(response.headers['Content-Type'], 'text/html', 'Should return HTML for 404');
    assert.ok(response.body.includes('404'), 'Should include 404 status code');
  });

  test('should handle errors gracefully', async () => {
    const { handler } = await import(handlerPath);
    
    // Create a request that might cause an error
    const mockRequest = {
      path: '/html-test',
      method: 'GET'
    };

    // Temporarily break the environment to simulate an error
    const originalCwd = process.cwd;
    process.cwd = () => { throw new Error('Simulated error'); };

    try {
      const response = await handler(mockRequest);
      
      assert.equal(response.statusCode, 500, 'Should return 500 for server errors');
      assert.equal(response.headers['Content-Type'], 'text/plain', 'Should return plain text for errors');
      assert.ok(response.body.includes('Internal server error'), 'Should include error message');
    } finally {
      process.cwd = originalCwd;
    }
  });

  test('should generate valid HTML structure in main route', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    // Check for essential HTML structure
    assert.ok(response.body.includes('<html lang="en">'), 'Should have language attribute');
    assert.ok(response.body.includes('<meta charset="UTF-8">'), 'Should have charset meta');
    assert.ok(response.body.includes('<meta name="viewport"'), 'Should have viewport meta');
    assert.ok(response.body.includes('<title>'), 'Should have title element');
    
    // Check for accessibility features
    assert.ok(response.body.includes('aria-label'), 'Should include ARIA labels');
    assert.ok(response.body.includes('role="log"'), 'Should include ARIA roles');
    
    // Check for test runner UI elements
    assert.ok(response.body.includes('id="run-all-tests"'), 'Should have run button');
    assert.ok(response.body.includes('id="clear-output"'), 'Should have clear button');
    
    // Check for Declarative Shadow DOM (test-output component gets resolved to this)
    assert.ok(response.body.includes('shadowrootmode="open"'), 'Should use Declarative Shadow DOM');
    assert.ok(response.body.includes('<template shadowrootmode="open">'), 'Should have shadow DOM template');
    
    // Check that test-output component was resolved (should contain the shadow DOM styles)
    assert.ok(response.body.includes(':host {'), 'Should include resolved test-output component styles');
  });

  test('should include discovered test files in HTML output', async () => {
    const { handler } = await import(handlerPath);
    
    const mockRequest = {
      path: '/html-test',
      method: 'GET'
    };

    const response = await handler(mockRequest);
    
    // Should include test file links
    assert.ok(response.body.includes('/html-test/file/'), 'Should include test file URLs');
    assert.ok(response.body.includes('test-file-link'), 'Should have test file link class');
    assert.ok(response.body.includes('example.test.html'), 'Should list first test file');
    assert.ok(response.body.includes('form.spec.html'), 'Should list second test file');
    
    // Should show empty state when no files
    if (!response.body.includes('example.test.html')) {
      assert.ok(response.body.includes('No test files found'), 'Should show empty state');
    }
  });
});