/**
 * Unit tests for plugin configuration and core functionality
 * Uses Node.js built-in test runner
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import plugin module for testing
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginPath = join(__dirname, '../../index.js');

describe('Plugin Configuration', () => {
  test('should export default plugin object with set and sandbox hooks', async () => {
    const plugin = await import(pluginPath);
    
    assert.ok(plugin.default, 'Plugin should have default export');
    assert.ok(plugin.default.set, 'Plugin should have set hook');
    assert.ok(plugin.default.sandbox, 'Plugin should have sandbox hook');
    assert.ok(typeof plugin.default.set.http === 'function', 'set.http should be a function');
    assert.ok(typeof plugin.default.sandbox.start === 'function', 'sandbox.start should be a function');
    assert.ok(typeof plugin.default.sandbox.watcher === 'function', 'sandbox.watcher should be a function');
  });

  test('should parse basic @html-test configuration', async () => {
    const plugin = await import(pluginPath);
    
    // Mock arc configuration
    const mockArc = {
      'html-test': [
        'directory tests/html',
        'patterns *.test.html *.spec.html',
        'ci-mode true',
        'auto-run false'
      ]
    };

    // Mock inventory for testing
    const mockInventory = {
      inv: {
        _project: {
          cwd: process.cwd()
        }
      }
    };

    // Test set.http hook
    const routes = plugin.default.set.http({ arc: mockArc, inventory: mockInventory });
    
    assert.ok(Array.isArray(routes), 'Should return array of routes');
    assert.equal(routes.length, 4, 'Should return 4 routes');
    
    // Check main route
    const mainRoute = routes.find(r => r.path === '/html-test');
    assert.ok(mainRoute, 'Should have main /html-test route');
    assert.equal(mainRoute.method, 'get', 'Main route should be GET');
    
    // Check file route
    const fileRoute = routes.find(r => r.path === '/html-test/file/*');
    assert.ok(fileRoute, 'Should have file route');
    assert.equal(fileRoute.method, 'get', 'File route should be GET');
    
    // Check CI/CD routes
    const jsonRoute = routes.find(r => r.path === '/html-test/results.json');
    const tapRoute = routes.find(r => r.path === '/html-test/results.tap');
    assert.ok(jsonRoute, 'Should have JSON results route');
    assert.ok(tapRoute, 'Should have TAP results route');
  });

  test('should handle empty @html-test configuration with defaults', async () => {
    const plugin = await import(pluginPath);
    
    // Mock arc with no html-test config
    const mockArc = {};
    const mockInventory = {
      inv: {
        _project: {
          cwd: process.cwd()
        }
      }
    };

    const routes = plugin.default.set.http({ arc: mockArc, inventory: mockInventory });
    
    assert.ok(Array.isArray(routes), 'Should return array of routes even with no config');
    assert.equal(routes.length, 4, 'Should return 4 routes with defaults');
  });
});

describe('Plugin Sandbox Hooks', () => {
  test('should have functional sandbox.start hook', async () => {
    const plugin = await import(pluginPath);
    
    const mockArc = {
      'html-test': ['directory test/fixtures']
    };
    
    const mockInventory = {
      inv: {
        _project: {
          cwd: process.cwd()
        }
      }
    };

    // Should not throw when called
    await assert.doesNotReject(async () => {
      await plugin.default.sandbox.start({ arc: mockArc, inventory: mockInventory });
    });
  });

  test('should have functional sandbox.watcher hook', async () => {
    const plugin = await import(pluginPath);
    
    const mockArc = {
      'html-test': ['directory test/fixtures']
    };
    
    const mockInventory = {
      inv: {
        _project: {
          cwd: process.cwd()
        }
      }
    };

    // Should not throw when called
    await assert.doesNotReject(async () => {
      await plugin.default.sandbox.watcher({
        filename: join(process.cwd(), 'test/fixtures/example.test.html'),
        event: 'change',
        inventory: mockInventory,
        arc: mockArc
      });
    });
  });
});