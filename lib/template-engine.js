/**
 * HTML Template Engine with Template Literal Support
 * 
 * Loads .html files and evaluates JavaScript template literal syntax
 * with full access to execution context (variables, process.env, etc.)
 * 
 * Features:
 * - Native template literal evaluation (${...} syntax)
 * - Custom Element resolution (<test-output> → test-output.html)
 * - Context injection (access to function parameters, env vars)
 * - File caching for performance
 * - Security boundaries for safe evaluation
 */

import { readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { stat } from 'fs/promises'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const templatesDir = join(dirname(__dirname), 'templates')

// Template cache for performance
const templateCache = new Map()
const customElementCache = new Map()

/**
 * Load and evaluate an HTML template with JavaScript template literals
 * @param {string} templatePath - Path to template file (relative to templates/)
 * @param {object} context - Variables to make available in template evaluation
 * @returns {Promise<string>} Evaluated HTML string
 */
export async function loadTemplate(templatePath, context = {}) {
  try {
    // Resolve full template path
    const fullPath = join(templatesDir, templatePath)
    
    // Check cache first (skip in development for hot reloading)
    const cacheKey = `${fullPath}:${JSON.stringify(Object.keys(context))}`
    if (process.env.NODE_ENV === 'production' && templateCache.has(cacheKey)) {
      return templateCache.get(cacheKey)
    }
    
    // Load template file
    const templateContent = await readFile(fullPath, 'utf-8')
    
    // Find and resolve custom elements
    const htmlWithCustomElements = await resolveCustomElements(templateContent, context)
    
    // Evaluate template literals in the HTML
    const evaluatedHTML = evaluateTemplate(htmlWithCustomElements, context)
    
    // Cache result in production
    if (process.env.NODE_ENV === 'production') {
      templateCache.set(cacheKey, evaluatedHTML)
    }
    
    return evaluatedHTML
    
  } catch (error) {
    console.error(`Template Engine Error: Failed to load template ${templatePath}`)
    console.error(error)
    
    // Return error template for development, throw in production
    if (process.env.NODE_ENV === 'development') {
      return generateErrorTemplate(templatePath, error)
    } else {
      throw error
    }
  }
}

/**
 * Detect custom elements in HTML and replace with their template content
 * @param {string} html - HTML content to scan
 * @param {object} context - Template context to pass to custom element templates
 * @returns {Promise<string>} HTML with custom elements resolved
 */
async function resolveCustomElements(html, context) {
  const customElements = findCustomElements(html)
  let processedHTML = html
  
  for (const element of customElements) {
    const templatePath = `components/${element.tagName}.html`
    
    try {
      // Check if template file exists
      const templateFile = join(templatesDir, templatePath)
      await stat(templateFile)
      
      // Load custom element template with same context
      const elementHTML = await loadTemplate(templatePath, { ...context })
      
      // Replace the custom element with its template content
      // Handle both self-closing and with content
      const selfClosingRegex = new RegExp(`<${element.tagName}([^>]*?)\\s*/>`, 'gi')
      const withContentRegex = new RegExp(`<${element.tagName}([^>]*?)>(.*?)</${element.tagName}>`, 'gis')
      
      processedHTML = processedHTML.replace(selfClosingRegex, elementHTML)
      processedHTML = processedHTML.replace(withContentRegex, elementHTML)
      
    } catch (error) {
      // Template file doesn't exist, leave element as-is
      // This allows for native Web Components that don't need templates
      console.log(`Template not found for custom element: ${element.tagName} (this is okay for native Web Components)`)
    }
  }
  
  return processedHTML
}

/**
 * Find all custom elements (non-standard HTML tags) in HTML content
 * @param {string} html - HTML content to scan  
 * @returns {Array} Array of custom element objects with tagName and attributes
 */
function findCustomElements(html) {
  const customElements = []
  
  // Standard HTML elements that should be ignored
  const standardElements = new Set([
    'html', 'head', 'title', 'meta', 'link', 'style', 'script',
    'body', 'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'strong', 'em', 'small', 'mark',
    'del', 'ins', 'sup', 'sub', 'blockquote', 'cite', 'abbr', 'address', 'time',
    'img', 'figure', 'figcaption', 'audio', 'video', 'source', 'track', 'canvas',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'form', 'input', 'textarea', 'button', 'select', 'option', 'optgroup', 'label',
    'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter',
    'details', 'summary', 'dialog', 'template', 'slot'
  ])
  
  // Find all element tags
  const elementRegex = /<([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/gi
  let match
  
  while ((match = elementRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase()
    
    // Check if it's a custom element (contains hyphen or not in standard set)
    if (tagName.includes('-') || !standardElements.has(tagName)) {
      // Skip if already found
      if (!customElements.some(el => el.tagName === tagName)) {
        customElements.push({
          tagName,
          fullMatch: match[0]
        })
      }
    }
  }
  
  return customElements
}

/**
 * Safely evaluate template literals in HTML content
 * @param {string} template - HTML template with ${...} expressions  
 * @param {object} context - Variables to make available during evaluation
 * @returns {string} HTML with template literals evaluated
 */
function evaluateTemplate(template, context) {
  try {
    // Create a safe evaluation context
    const safeContext = createSafeContext(context)
    
    // Convert template literal syntax to function body
    // Replace ${...} with string concatenation
    const functionBody = `
      'use strict';
      const { ${Object.keys(safeContext).join(', ')} } = arguments[0];
      return \`${template}\`;
    `
    
    // Create and execute the template function
    const templateFunction = new Function(functionBody)
    return templateFunction(safeContext)
    
  } catch (error) {
    console.error('Template Evaluation Error:', error)
    
    if (process.env.NODE_ENV === 'development') {
      return `
        <div style="border: 2px solid red; padding: 16px; margin: 16px; background: #ffe6e6;">
          <h3>Template Evaluation Error</h3>
          <pre>${error.message}</pre>
          <details>
            <summary>Original Template</summary>
            <pre>${template}</pre>
          </details>
        </div>
      `
    } else {
      throw error
    }
  }
}

/**
 * Create a safe context for template evaluation
 * @param {object} context - Raw context object
 * @returns {object} Sanitized context with safe utilities
 */
function createSafeContext(context) {
  // Start with a safe base context
  const safeContext = {
    // Environment variables (read-only)
    env: { ...process.env },
    
    // Safe utility functions
    encodeURIComponent,
    decodeURIComponent,
    parseInt,
    parseFloat,
    Math,
    Date,
    JSON,
    
    // Safe string methods
    escape: (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;'),
      
    // Array utilities
    map: (array, fn) => Array.isArray(array) ? array.map(fn) : [],
    filter: (array, fn) => Array.isArray(array) ? array.filter(fn) : [],
    join: (array, separator) => Array.isArray(array) ? array.join(separator) : '',
  }
  
  // Add user-provided context (with sanitization)
  for (const [key, value] of Object.entries(context)) {
    if (isSafeValue(key, value)) {
      safeContext[key] = value
    } else {
      console.warn(`Template Engine: Skipping unsafe context value: ${key}`)
    }
  }
  
  return safeContext
}

/**
 * Check if a context value is safe for template evaluation
 * @param {string} key - Context key name
 * @param {*} value - Context value
 * @returns {boolean} True if safe to include
 */
function isSafeValue(key, value) {
  // Allow specific known safe keys
  const allowedKeys = ['env', 'testFiles', 'config', 'testFile', 'requestPath', 'requestMethod']
  if (allowedKeys.includes(key)) return true
  
  // Reject dangerous keys
  const dangerousKeys = ['eval', 'Function', 'constructor', '__proto__', 'prototype']
  if (dangerousKeys.includes(key)) return false
  
  // Reject functions (except safe utilities we explicitly allow)
  if (typeof value === 'function') return false
  
  // Reject objects with dangerous properties
  if (typeof value === 'object' && value !== null) {
    // Allow plain objects and arrays
    if (value.constructor === Object || value.constructor === Array) return true
    // Allow common safe objects
    if (value instanceof Date || value instanceof String || value instanceof Number) return true
    // Otherwise reject
    return false
  }
  
  return true
}

/**
 * Generate an error template for development debugging
 * @param {string} templatePath - Path that failed to load
 * @param {Error} error - The error that occurred
 * @returns {string} HTML error template
 */
function generateErrorTemplate(templatePath, error) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Error</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f8f8f8; }
        .error { background: #ffebee; border: 1px solid #f44336; padding: 20px; border-radius: 4px; }
        .error h2 { color: #d32f2f; margin-top: 0; }
        pre { background: white; padding: 10px; border-radius: 2px; overflow-x: auto; }
        .stack { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="error">
        <h2>🚨 Template Engine Error</h2>
        <p><strong>Template:</strong> <code>${templatePath}</code></p>
        <p><strong>Error:</strong> ${error.message}</p>
        <details>
            <summary>Stack Trace</summary>
            <pre class="stack">${error.stack}</pre>
        </details>
        <p><em>This error is only shown in development mode.</em></p>
    </div>
</body>
</html>
  `
}

/**
 * Clear template cache (useful for development hot reloading)
 */
export function clearTemplateCache() {
  templateCache.clear()
  customElementCache.clear()
  console.log('Template cache cleared')
}

/**
 * Get template cache statistics
 * @returns {object} Cache stats
 */
export function getTemplateCacheStats() {
  return {
    templates: templateCache.size,
    customElements: customElementCache.size
  }
}