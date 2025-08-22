/**
 * Architect Plugin: HTML Test Runner
 * 
 * Provides vanilla JavaScript HTML testing with TAP output and CI/CD integration.
 * Uses Declarative Shadow DOM and web standards - no build tools required.
 */

import { readdir, stat } from 'fs/promises'
import { join, extname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Parse plugin configuration from app.arc
 */
function parseConfig(arc) {
  const htmlTestConfig = arc['html-test'] || []
  const config = {
    directory: 'tests/html',
    outputFormat: 'tap',
    ciMode: false,
    autoRun: true,
    patterns: ['*.test.html', '*.spec.html']
  }
  
  // Parse configuration lines
  for (const line of htmlTestConfig) {
    const [key, ...values] = line.split(' ')
    const value = values.length === 1 ? values[0] : values
    
    switch (key) {
      case 'directory':
        config.directory = value
        break
      case 'output-format':
        config.outputFormat = value
        break
      case 'ci-mode':
        config.ciMode = value === 'true'
        break
      case 'auto-run':
        config.autoRun = value === 'true'
        break
      case 'patterns':
        config.patterns = Array.isArray(value) ? value : [value]
        break
    }
  }
  
  return config
}

/**
 * Discover HTML test files in configured directory
 */
async function discoverTestFiles(testDir, cwd, patterns = ['*.test.html', '*.spec.html']) {
  const testFiles = []
  const fullPath = join(cwd, testDir)
  
  try {
    await stat(fullPath) // Check if directory exists
    
    const files = await readdir(fullPath, { recursive: true })
    
    for (const file of files) {
      const filePath = join(fullPath, file)
      const stats = await stat(filePath)
      
      // Check if file matches any of the patterns
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
    console.log(`HTML test directory ${testDir} not found or not accessible`)
  }
  
  return testFiles.sort((a, b) => a.name.localeCompare(b.name))
}

export default {
  // Set plugin: Add HTTP routes and resources
  set: {
    http({ arc, inventory }) {
      const config = parseConfig(arc)
      
      return [
        // Main test runner route
        {
          method: 'get',
          path: '/html-test',
          src: join(__dirname, 'handler')
        },
        // Individual test file routes
        {
          method: 'get', 
          path: '/html-test/file/*',
          src: join(__dirname, 'handler')
        },
        // CI/CD results endpoints
        {
          method: 'get',
          path: '/html-test/results.json',
          src: join(__dirname, 'handler')
        },
        {
          method: 'get',
          path: '/html-test/results.tap', 
          src: join(__dirname, 'handler')
        }
      ]
    }
  },

  // Sandbox plugin: Development-time functionality
  sandbox: {
    start: async ({ arc, inventory }) => {
      const config = parseConfig(arc)
      const testFiles = await discoverTestFiles(
        config.directory, 
        inventory.inv._project.cwd,
        config.patterns
      )
      
      console.log(`🧪 HTML Test Plugin loaded`)
      console.log(`   Test directory: ${config.directory}`)
      console.log(`   File patterns: ${config.patterns.join(', ')}`)
      console.log(`   Found ${testFiles.length} test files`)
      if (testFiles.length > 0) {
        testFiles.forEach(file => {
          console.log(`     • ${file.name}`)
        })
      }
      console.log(`   Visit: http://localhost:3333/html-test`)
    },

    watcher: async ({ filename, event, inventory, arc }) => {
      const config = parseConfig(arc)
      const testDir = join(inventory.inv._project.cwd, config.directory)
      
      // Watch for changes in test directory
      if (filename.startsWith(testDir)) {
        const matchesPattern = config.patterns.some(pattern => {
          const regex = new RegExp(pattern.replace('*', '.*'))
          return regex.test(filename)
        })
        
        if (matchesPattern) {
          console.log(`🔄 HTML test file ${event}: ${relative(inventory.inv._project.cwd, filename)}`)
        }
      }
    }
  }
}