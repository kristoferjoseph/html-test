/**
 * HTTP Route Handler for HTML Test Plugin
 * 
 * Handles all /html-test routes including:
 * - Main test runner interface
 * - Individual test file execution  
 * - CI/CD results endpoints
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

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
 * Generate main test runner HTML page
 */
function generateTestRunnerHTML(testFiles = []) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Test Runner - Plugin</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧪</text></svg>">
    <link rel="stylesheet" href="/html-test/static/styles/test.css">
</head>
<body>
    <header class="header">
        <h1>🧪 HTML Test Runner</h1>
        <div class="test-controls">
            <button id="run-all-tests" class="run-button" aria-label="Run all discovered tests">Run All Tests</button>
            <button id="clear-output" class="clear-button" aria-label="Clear test output">Clear</button>
        </div>
    </header>

    <main class="main">
        <section class="test-area" aria-labelledby="test-files-heading">
            <h2 id="test-files-heading">Discovered Test Files</h2>
            <div id="test-files">
                ${testFiles.length > 0 ? `
                    <ul class="test-file-list">
                        ${testFiles.map(file => `
                            <li class="test-file-item">
                                <a href="${file.url}" class="test-file-link">${file.name}</a>
                                <span class="test-file-path">${file.path}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <div class="empty-state">
                        <p>No test files found in the configured directory.</p>
                        <p>Add <code>*.test.html</code> or <code>*.spec.html</code> files to get started.</p>
                    </div>
                `}
            </div>
        </section>

        <section class="output-area" aria-labelledby="test-output-heading">
            <h2 id="test-output-heading">Test Results</h2>
            <test-output id="test-output" role="log" aria-live="polite" aria-label="Test results output">
                <template shadowrootmode="open">
                    <style>
                        :host {
                            display: block;
                            border: 1px solid #e5e5e5;
                            border-radius: 2px;
                            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                            font-size: 13px;
                            line-height: 1.4;
                        }
                        .header {
                            background: #f8f9fa;
                            border-bottom: 1px solid #e5e5e5;
                            padding: 12px 16px;
                        }
                        .status {
                            font-weight: 500;
                            margin: 0;
                        }
                        .status.running { color: #495057; }
                        .status.success { color: #28a745; }
                        .status.failure { color: #dc3545; }
                        .progress {
                            margin-top: 8px;
                            height: 2px;
                            background: #e9ecef;
                            border-radius: 1px;
                            overflow: hidden;
                        }
                        .progress-bar {
                            height: 100%;
                            background: #007bff;
                            transition: width 0.3s ease;
                            width: 0%;
                        }
                        .output {
                            max-height: 400px;
                            overflow-y: auto;
                            padding: 0;
                            margin: 0;
                            background: #ffffff;
                        }
                        .line {
                            padding: 2px 16px;
                            border-left: 3px solid transparent;
                            white-space: pre-wrap;
                            word-break: break-word;
                        }
                        .line.pass {
                            color: #28a745;
                            border-left-color: #28a745;
                            background: #f8fff9;
                        }
                        .line.fail {
                            color: #dc3545;
                            border-left-color: #dc3545;
                            background: #fff8f8;
                        }
                        .line.summary {
                            font-weight: 600;
                            color: #343a40;
                            background: #f8f9fa;
                            border-left-color: #495057;
                        }
                        .line.meta {
                            color: #495057;
                            font-style: italic;
                        }
                        .line.detail {
                            color: #495057;
                            background: #f8f9fa;
                            font-size: 12px;
                        }
                        .empty-state {
                            padding: 32px 16px;
                            text-align: center;
                            color: #495057;
                        }
                    </style>
                    
                    <div class="header">
                        <div class="status" role="status" aria-live="polite" aria-atomic="true">Ready</div>
                        <div class="progress">
                            <div class="progress-bar"></div>
                        </div>
                    </div>
                    
                    <div class="output" role="log" aria-label="Test execution output" aria-live="polite">
                        <div class="empty-state">Click "Run All Tests" to execute discovered test files.</div>
                    </div>
                </template>
            </test-output>
        </section>
    </main>

    <script type="module" src="/html-test/static/js/plugin-main.js"></script>
</body>
</html>`
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
        body: generateTestRunnerHTML(testFiles)
      }
    }
    
    if (path.startsWith('/html-test/file/')) {
      // Individual test file execution
      const testFile = decodeURIComponent(path.replace('/html-test/file/', ''))
      // TODO: Load and serve specific test file
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        },
        body: `<h1>Test File: ${testFile}</h1><p>TODO: Implement test file loading</p>`
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
      headers: { 'Content-Type': 'text/plain' },
      body: 'Not found'
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