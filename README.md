# arc-plugin-html-test

An Architect plugin for vanilla JavaScript HTML testing with TAP output and CI/CD integration.

## Features

- **Zero Build Tools**: Pure vanilla JavaScript with ES modules and Web Components
- **Declarative Shadow DOM**: Modern web standards-compliant component architecture
- **Configurable Test Discovery**: Automatically finds HTML test files in your project
- **TAP v13 Compliance**: Standard test output format for CI systems
- **CI/CD Integration**: JSON and TAP endpoints for automated testing pipelines
- **Live Reload**: File watching during development
- **Comprehensive Assertions**: 19+ DOM-specific assertion methods

## Installation

```bash
npm install arc-plugin-html-test
```

## Usage

### 1. Add Plugin to Your Architect Project

Add the plugin to your `app.arc` manifest:

```arc
@app
my-app

@plugins
arc-plugin-html-test

@html-test
directory tests/html
patterns *.test.html *.spec.html
output-format tap
ci-mode true
auto-run true

@http
# Your existing routes
```

### 2. Configuration Options

All configuration is optional. Here are the defaults:

| Option | Default | Description |
|--------|---------|-------------|
| `directory` | `tests/html` | Directory to scan for test files |
| `patterns` | `*.test.html *.spec.html` | File patterns to match |
| `output-format` | `tap` | Output format (currently only TAP) |
| `ci-mode` | `false` | Enable CI/CD integration features |
| `auto-run` | `true` | Auto-run tests when page loads |

### 3. Create Test Files

Create HTML test files in your configured directory:

```html
<!-- tests/html/example.test.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Example Test</title>
</head>
<body>
    <div id="app">
        <h1>Hello World</h1>
        <button id="click-me">Click Me</button>
    </div>

    <script type="module">
        // Tests are defined inline in the HTML file
        test('should have main heading', () => {
            assert.exists('#app h1');
            assert.text('#app h1', 'Hello World');
        });

        test('should have clickable button', () => {
            assert.exists('#click-me');
            assert.enabled('#click-me');
        });

        test('async test example', async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            assert.exists('#app');
        });
    </script>
</body>
</html>
```

### 4. Run Tests

Start your Architect development server:

```bash
arc sandbox
```

Visit the test runner interface:
- **Main Interface**: `http://localhost:3333/html-test`
- **Individual Test**: `http://localhost:3333/html-test/file/example.test.html`

## Available Assertions

The plugin includes a comprehensive assertion library with 19+ methods:

### DOM Element Assertions

```javascript
assert.exists('#selector')              // Element exists
assert.notExists('#selector')           // Element doesn't exist  
assert.count('li', 3)                   // Count matching elements
```

### Text Content Assertions

```javascript
assert.text('#title', 'Expected Text')          // Exact text match
assert.textContains('#desc', 'partial text')    // Partial text match
```

### Attribute Assertions

```javascript
assert.attribute('#link', 'href', '/path')      // Exact attribute value
assert.hasAttribute('#input', 'required')       // Attribute exists
assert.notHasAttribute('#input', 'disabled')    // Attribute doesn't exist
```

### Visibility Assertions

```javascript
assert.visible('#element')              // Element is visible
assert.hidden('#element')               // Element is hidden
```

### Form Element Assertions

```javascript
assert.disabled('#submit')              // Form element is disabled
assert.enabled('#submit')               // Form element is enabled
assert.value('#input', 'expected')      // Input/textarea value
assert.checked('#checkbox')             // Checkbox/radio is checked
assert.notChecked('#checkbox')          // Checkbox/radio is not checked
```

### CSS Class Assertions

```javascript
assert.hasClass('#element', 'active')   // Element has CSS class
assert.notHasClass('#element', 'error') // Element doesn't have class
```

### Value Comparison Assertions

```javascript
assert.isEqual(actual, expected)        // Strict equality
assert.isTrue(value)                    // Value is exactly true
assert.isFalse(value)                   // Value is exactly false
```

### Error Handling Assertions

```javascript
assert.throws(() => {                   // Function throws error
    riskyFunction();
}, TypeError);
```

## CI/CD Integration

The plugin provides endpoints for automated testing:

### JSON Results Endpoint

```bash
# Get test results as JSON
curl http://localhost:3333/html-test/results.json
```

Response:
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "status": "completed",
  "total": 8,
  "passed": 8,
  "failed": 0,
  "success": true,
  "files": [
    {
      "url": "/html-test/file/example.test.html",
      "tests": 3,
      "passed": 3,
      "failed": 0
    }
  ]
}
```

### TAP Results Endpoint

```bash
# Get test results as TAP
curl http://localhost:3333/html-test/results.tap
```

Response:
```
TAP version 13
1..8
ok 1 - should have main heading
ok 2 - should have clickable button  
ok 3 - async test example
# PASS 8/8
```

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: HTML Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Start test server
        run: |
          npm start &
          sleep 10
          
      - name: Run HTML tests
        run: |
          # Wait for server to be ready
          curl --retry 10 --retry-delay 1 http://localhost:3333/html-test
          
          # Run tests and get results
          TEST_RESULTS=$(curl -s http://localhost:3333/html-test/results.json)
          echo "Test Results: $TEST_RESULTS"
          
          # Check if tests passed
          SUCCESS=$(echo $TEST_RESULTS | jq -r '.success')
          if [ "$SUCCESS" != "true" ]; then
            echo "Tests failed!"
            curl -s http://localhost:3333/html-test/results.tap
            exit 1
          fi
          
          echo "All tests passed!"
```

## Development

The plugin follows strict web standards with no build tools:

- **ES Modules**: Native browser module loading
- **Declarative Shadow DOM**: Modern component architecture  
- **Web Components**: Custom elements with proper lifecycle
- **No Frameworks**: Pure vanilla JavaScript
- **Progressive Enhancement**: Works without JavaScript for basic HTML

## Architecture

```
arc-plugin-html-test/
├── index.js                 # Main plugin file (set/sandbox hooks)
├── handler/                 # HTTP route handlers
│   └── index.js            # /html-test route logic
├── lib/                    # Shared libraries
│   ├── browser-assertions.js
│   ├── test-config.js
│   └── test-runner.js
├── static/                 # Client-side assets
│   ├── components/         # Web Components
│   ├── js/                # JavaScript modules
│   ├── lib/               # Browser libraries
│   └── styles/            # CSS styling
└── README.md              # This file
```

## Requirements

- **Node.js**: 18+
- **Architect**: 11.0.0+
- **Modern Browser**: ES Module support required

## License

Apache-2.0

## Contributing

This plugin prioritizes web standards, native browser capabilities, and zero build dependencies. All contributions must align with these principles.