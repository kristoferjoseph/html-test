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

### DOM Element Assertions

**`assert.exists(selector)`** - Verify element exists in DOM
```javascript
test('should find submit button', () => {
  assert.exists('#submit-btn');
});
```

**`assert.notExists(selector)`** - Verify element does not exist
```javascript
test('should not have error message initially', () => {
  assert.notExists('.error-message');
});
```

**`assert.count(selector, expectedCount)`** - Count matching elements
```javascript
test('should have 3 navigation items', () => {
  assert.count('nav li', 3);
});
```

### Text Content Assertions

**`assert.text(selector, expectedText)`** - Exact text match
```javascript
test('should display welcome message', () => {
  assert.text('#welcome', 'Welcome to our site!');
});
```

**`assert.textContains(selector, expectedText)`** - Partial text match
```javascript
test('should contain user name in heading', () => {
  assert.textContains('h1', 'John');
});
```

### Attribute Assertions

**`assert.attribute(selector, attributeName, expectedValue)`** - Exact attribute value
```javascript
test('should have correct href attribute', () => {
  assert.attribute('#home-link', 'href', '/home');
});
```

**`assert.hasAttribute(selector, attributeName)`** - Attribute exists
```javascript
test('should have required attribute', () => {
  assert.hasAttribute('#email', 'required');
});
```

**`assert.notHasAttribute(selector, attributeName)`** - Attribute does not exist
```javascript
test('should not have disabled attribute', () => {
  assert.notHasAttribute('#submit', 'disabled');
});
```

### Visibility Assertions

**`assert.visible(selector)`** - Element is visible (not display:none, visibility:hidden, or opacity:0)
```javascript
test('should show success message', () => {
  assert.visible('#success-alert');
});
```

**`assert.hidden(selector)`** - Element is hidden
```javascript
test('should hide loading spinner', () => {
  assert.hidden('#loading-spinner');
});
```

### Form Element Assertions

**`assert.disabled(selector)`** - Form element is disabled
```javascript
test('should disable submit when form invalid', () => {
  assert.disabled('#submit-btn');
});
```

**`assert.enabled(selector)`** - Form element is enabled
```javascript
test('should enable button when form valid', () => {
  assert.enabled('#submit-btn');
});
```

**`assert.value(selector, expectedValue)`** - Input/textarea value
```javascript
test('should have default email value', () => {
  assert.value('#email', 'user@example.com');
});
```

**`assert.checked(selector)`** - Checkbox/radio is checked
```javascript
test('should check terms checkbox', () => {
  assert.checked('#terms-accepted');
});
```

**`assert.notChecked(selector)`** - Checkbox/radio is not checked
```javascript
test('should not check newsletter by default', () => {
  assert.notChecked('#newsletter-signup');
});
```

### CSS Class Assertions

**`assert.hasClass(selector, className)`** - Element has CSS class
```javascript
test('should have active class on current tab', () => {
  assert.hasClass('#tab-home', 'active');
});
```

**`assert.notHasClass(selector, className)`** - Element does not have CSS class
```javascript
test('should not have error class initially', () => {
  assert.notHasClass('#form', 'has-error');
});
```

### CSS Selector Assertions

**`assert.matches(selector, cssSelector)`** - Element matches CSS selector
```javascript
test('should match pseudo-class selector', () => {
  assert.matches('#input', ':focus');
});
```

### Value Comparison Assertions

**`assert.isEqual(actual, expected)`** - Strict equality comparison
```javascript
test('should calculate correct total', () => {
  const total = calculateTotal([10, 20, 30]);
  assert.isEqual(total, 60);
});
```

**`assert.isTrue(value)`** - Value is exactly true
```javascript
test('should validate email format', () => {
  assert.isTrue(isValidEmail('test@example.com'));
});
```

**`assert.isFalse(value)`** - Value is exactly false
```javascript
test('should reject invalid email', () => {
  assert.isFalse(isValidEmail('invalid-email'));
});
```

### Error Handling Assertions

**`assert.throws(fn, expectedError?)`** - Function throws an error
```javascript
test('should throw error for invalid input', () => {
  assert.throws(() => {
    processData(null);
  }, TypeError);
});

// Or just verify that any error is thrown
test('should throw on empty string', () => {
  assert.throws(() => validateRequired(''));
});
```

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