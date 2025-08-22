# HTML Test Framework

A generalized vanilla JavaScript testing framework for HTML applications. Load and test HTML files from any location with ES modules, Web Components, and TAP-compliant output.

## Features

- **Configurable Test Sources**: Load HTML test files from local or remote locations
- **Standalone Assertion Library**: Browser-native DOM assertions with zero dependencies
- **Flexible Test Runner**: Programmatic API for custom CI/CD integration
- **TAP v13 Compliance**: Standard test output format for CI systems
- **ES Modules**: Native browser module loading, no build tools required
- **Web Components**: Custom elements for rich test UI
- **Auto-Discovery**: Automatically finds and runs tests in HTML files
- **Multiple Configuration Methods**: JSON, programmatic, or DOM-based config

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install -g @architect/architect
   ```

2. **Start development server**:
   ```bash
   arc sandbox
   ```

3. **Visit the test runner**:
   - Main page: `http://localhost:3333`
   - Test pages: `http://localhost:3333/test/example`

## Configuration

### 1. JSON Configuration in HTML
```html
<script type="application/json" data-test-config>
{
  "testFiles": [
    "/tests/homepage.test.html",
    "/tests/contact.test.html"
  ],
  "autoRun": true,
  "remoteBaseUrl": "https://my-tests.com/"
}
</script>
```

### 2. Programmatic Configuration
```javascript
import { TestRunner, TestConfig } from '/_static/lib/test-runner.js';

const config = new TestConfig({
  testFiles: [
    'https://example.com/tests/api.test.html',
    '/local/tests/ui.test.html'
  ],
  autoRun: false,
  ciMode: true
});

const runner = new TestRunner(config);
await runner.runAllTests();
```

### 3. Auto-Setup
```javascript
import { TestConfig } from '/_static/lib/test-config.js';

// Loads config from DOM and sets up UI automatically
const config = await TestConfig.fromElement();
const runner = new TestRunner(config);
runner.setupUI();
```

## Project Structure

```
├── app.arc                 # Architect manifest
├── src/http/              # HTTP route handlers
├── public/               # Static assets served at /_static/
│   ├── lib/              # Standalone modules
│   │   ├── browser-assertions.js  # Assertion library
│   │   ├── test-config.js         # Configuration system
│   │   └── test-runner.js         # Generalized test runner
│   ├── modules/          # Framework modules
│   ├── components/       # Web Components
│   ├── examples/         # Usage examples
│   └── styles/           # CSS styling
└── README.md
```

## Writing Tests

```javascript
import { test, assert } from '/_static/modules/test-framework.js';

// Simple assertions
test('should find element', () => {
  assert.exists('#my-element');
});

test('should verify text content', () => {
  assert.text('#title', 'Expected Title');
});

// Async tests
test('async operation', async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.exists('#loaded-content');
});

// Run all tests
await runTests();
```

## Available Assertions

- `assert.exists(selector)` - Element exists in DOM
- `assert.text(selector, text)` - Element text matches
- `assert.value(selector, value)` - Input value matches
- `assert.visible(selector)` - Element is visible
- `assert.hidden(selector)` - Element is hidden
- `assert.disabled(selector)` - Element is disabled
- `assert.hasClass(selector, className)` - Element has CSS class
- `assert.count(selector, number)` - Number of matching elements
- And many more...

## TAP Output

Tests output TAP v13 format to both console and DOM:

```
TAP version 13
1..8
ok 1 - should find test paragraph
ok 2 - should verify paragraph text
ok 3 - should check button is disabled
ok 4 - should verify input value
ok 5 - should count list items
ok 6 - should check element has class
ok 7 - should verify hidden element
ok 8 - async test example
# PASS 8/8
```

## CI/CD Integration

The framework outputs TAP-compliant results to stdout, making it compatible with CI systems:

```bash
# Example CI usage (would need headless browser setup)
npx playwright test --reporter=tap
```

## Architecture

Built following strict web standards:

- **No Build Tools**: Direct ES module loading in browsers
- **No Frameworks**: Vanilla JavaScript with Web Components
- **Serverless**: Architect framework for AWS Lambda deployment
- **Progressive Enhancement**: Works without JavaScript for basic HTML
- **Standards Compliant**: HTML5, CSS3, ES2020+ only

## Development Philosophy

**ALWAYS DO THE LEAST AMOUNT OF CHANGES TO FULFILL THE REQUIREMENTS**

- Make minimal, targeted changes
- Avoid over-engineering
- Choose the simplest solution that works
- Focus on exact requirements

## License

MIT