/**
 * HTTP Route Handler for HTML Test Plugin
 * 
 * Handles all /html-test routes including:
 * - Main test runner interface
 * - Individual test file execution  
 * - CI/CD results endpoints
 * 
 * Now powered by the revolutionary HTML Template Engine!
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { loadTemplate, clearTemplateCache } from '../lib/template-engine.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pluginRoot = dirname(__dirname)

// Shared test results storage (in-memory for now)
let testResults = {
  timestamp: null,
  status: 'pending',
  total: 0,
  passed: 0,
  failed: 0,
  files: [],
  tapOutput: []
}

/**
 * Parse plugin configuration from environment or defaults
 */
function getConfig() {
  return {
    directory: process.env.HTML_TEST_DIRECTORY || 'tests/html',
    outputFormat: process.env.HTML_TEST_OUTPUT_FORMAT || 'tap',
    ciMode: process.env.HTML_TEST_CI_MODE === 'true',
    autoRun: process.env.HTML_TEST_AUTO_RUN !== 'false',
    patterns: (process.env.HTML_TEST_PATTERNS || '*.test.html,*.spec.html').split(',')
  }
}

/**
 * Discover HTML test files (same logic as plugin)
 */
async function discoverTestFiles(testDir, patterns = ['*.test.html', '*.spec.html']) {
  const testFiles = []
  const cwd = process.cwd()
  const fullPath = join(cwd, testDir)
  
  try {
    await stat(fullPath)
    const files = await readdir(fullPath, { recursive: true })
    
    for (const file of files) {
      const filePath = join(fullPath, file)
      const stats = await stat(filePath)
      
      const matchesPattern = patterns.some(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'))
        return regex.test(file)
      })
      
      if (stats.isFile() && matchesPattern) {
        const relativePath = relative(testDir, file)
        testFiles.push({
          name: file,
          path: relative(cwd, filePath),
          relativePath,
          url: `/html-test/file/${encodeURIComponent(relativePath)}`,
          size: stats.size,
          modified: stats.mtime.toISOString()
        })
      }
    }
  } catch (error) {
    console.log(`Test directory ${testDir} not found`)
  }
  
  return testFiles.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Generate main test runner HTML page using template engine
 */
async function generateTestRunnerHTML(testFiles = [], config = {}) {
  return await loadTemplate('main-test-runner.html', {
    testFiles,
    config,
    env: process.env
  })
}

export async function handler(req) {
  const { path, method } = req
  const config = getConfig()

  try {
    // Handle different route patterns
    if (path === '/html-test') {
      // Main test runner interface - discover test files
      const testFiles = await discoverTestFiles(config.directory, config.patterns)
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self' ws://localhost:2222;"
        },
        body: await generateTestRunnerHTML(testFiles, config)
      }
    }
    
    if (path.startsWith('/html-test/file/')) {
      // Individual test file execution
      const testFile = decodeURIComponent(path.replace('/html-test/file/', ''))
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        },
        body: await loadTemplate('pages/individual-test.html', {
          testFile,
          config,
          env: process.env
        })
      }
    }
    
    if (path === '/html-test/results.json') {
      // CI/CD JSON results endpoint
      if (method === 'POST') {
        // Store results from test runner
        try {
          const body = JSON.parse(req.body || '{}')
          testResults = {
            ...testResults,
            ...body,
            timestamp: new Date().toISOString()
          }
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'stored', timestamp: testResults.timestamp })
          }
        } catch (error) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid JSON' })
          }
        }
      } else {
        // Return stored results
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(testResults)
        }
      }
    }
    
    if (path === '/html-test/results.tap') {
      // CI/CD TAP results endpoint  
      if (method === 'POST') {
        // Store TAP output
        testResults.tapOutput = req.body ? req.body.split('\\n') : []
        testResults.timestamp = new Date().toISOString()
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: 'TAP results stored'
        }
      } else {
        // Return TAP output
        const tapOutput = testResults.tapOutput.length > 0 
          ? testResults.tapOutput.join('\\n')
          : 'TAP version 13\\n# No test results available yet'
          
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache'
          },
          body: tapOutput
        }
      }
    }
    
    if (path === '/html-test/dev/clear-cache' && process.env.NODE_ENV === 'development') {
      // Development endpoint to clear template cache for hot reloading
      clearTemplateCache()
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Template cache cleared', 
          timestamp: new Date().toISOString() 
        })
      }
    }
    
    if (path.startsWith('/html-test/static/')) {
      // Static asset serving
      const assetPath = path.replace('/html-test/static/', '')
      // TODO: Serve static assets from plugin
      
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: `Asset not found: ${assetPath}`
      }
    }

    // 404 for unknown paths
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html' },
      body: await loadTemplate('errors/404.html', {
        requestPath: path,
        requestMethod: method,
        env: process.env
      })
    }
    
  } catch (error) {
    console.error('HTML Test Plugin error:', error)
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal server error'
    }
  }
}