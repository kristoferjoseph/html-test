# CLAUDE.md - HTML Test Framework Technical Guidelines

## Project Overview

This is a **generalized HTML testing framework** built with vanilla JavaScript, ES modules, and Web Components. The framework allows users to configure test sources (local or remote HTML files) and provides CI/CD integration through TAP-compliant output.

## Core Technology Stack

This project adheres to **strict standards-based web development** with zero framework dependencies. All code must follow these guidelines without exception.

## Development Philosophy

**ALWAYS DO THE LEAST AMOUNT OF CHANGES TO FULFILL THE REQUIREMENTS**

- Make minimal, targeted changes that directly address the specific request
- Avoid over-engineering or adding unnecessary complexity
- Choose the simplest solution that works reliably
- Resist the urge to add "improvements" that weren't asked for
- Focus on the exact requirement, nothing more

## Frontend Architecture

### HTML/CSS/JavaScript Standards
- **HTML5 Standards Only**: Follow W3C specifications and semantic markup
- **CSS Standards**: Use modern CSS features, custom properties, and standard selectors
- **Vanilla JavaScript Only**: No frameworks, libraries, or transpilation
- **Reference Documentation**: [MDN Web Docs](https://developer.mozilla.org/en-US/)

### Module System Requirements
- **ES Modules ONLY**: All JavaScript must use ES Module syntax (`import`/`export`)
- **No CommonJS**: Never use `require()`, `module.exports`, or CommonJS syntax
- **Import Maps**: Use import maps for bare specifiers and module resolution (if needed)
- **Native Browser Loading**: Leverage native ES Module loading in browsers

### Component Architecture
- **Custom Elements**: Implement all UI components using Web Components/Custom Elements
- **Declarative Shadow DOM**: ALWAYS use `<template shadowrootmode="open">` in HTML instead of `innerHTML` string templates
- **Shadow DOM**: Utilize Shadow DOM for encapsulation when appropriate
- **HTML Templates**: Use `<template>` elements for component markup
- **No String Templates**: Never use `shadowRoot.innerHTML = "template string"` - always use declarative templates
- **Lifecycle Callbacks**: Implement standard Custom Element lifecycle methods
- **Component Readiness**: Use `customElements.whenDefined()` for proper timing

## Backend Architecture

### Server Framework
- **Architect Serverless Framework**: All server functionality via [Architect](https://arc.codes)
- **Serverless Functions**: Lambda-based route handlers
- **Infrastructure as Code**: Define architecture in `app.arc` manifest

### Static File Serving
- **Architect @static**: Use built-in static file serving at `/_static/` prefix
- **No Custom Lambda Routes**: Avoid custom file serving routes when possible
- **Proper MIME Types**: Architect handles content types automatically

## Project Structure

```
├── app.arc                           # Architect manifest
├── README.md                         # Project documentation
├── CLAUDE.md                         # This technical guide
├── src/
│   └── http/                        # HTTP route handlers
│       ├── get-index/               # Main test runner page
│       └── get-test-catchall/       # Individual test pages (legacy)
├── public/                          # Static assets (served at /_static/)
│   ├── lib/                         # **Standalone Modules**
│   │   ├── browser-assertions.js    # Independent assertion library
│   │   ├── test-config.js          # Configuration system
│   │   └── test-runner.js          # Generalized test runner
│   ├── modules/                     # **Framework Modules**
│   │   ├── test-framework.js        # Original test framework
│   │   └── tap-reporter.js         # TAP output formatter
│   ├── components/                  # **Web Components**
│   │   └── test-output.js          # Test output UI component
│   ├── styles/                      # **CSS Styling**
│   │   └── test.css                # Swiss-inspired design
│   └── examples/                    # **Usage Examples**
│       ├── example-config.js        # Configuration examples
│       └── sample.test.html         # Sample test file
```

## Module Architecture

### Standalone Libraries (`/lib/`)
These modules can be used independently of the framework:

- **`browser-assertions.js`**: DOM assertion library with 20+ methods
- **`test-config.js`**: Configuration system for test sources and behavior
- **`test-runner.js`**: Generalized test runner for loading external HTML files

### Framework Modules (`/modules/`)
Core framework functionality:

- **`test-framework.js`**: Original in-page testing system
- **`tap-reporter.js`**: TAP v13 compliant output formatter

### Web Components (`/components/`)
UI components for test display:

- **`test-output.js`**: Custom element for live test result display

## Development Standards

### ES Module Patterns
```javascript
// ✅ Correct ES Module syntax
import { BrowserAssertions } from './lib/browser-assertions.js';
import { TestConfig } from './lib/test-config.js';
export { TestRunner };
export default class TestFramework extends HTMLElement { }

// ❌ Never use CommonJS
const TestRunner = require('./lib/test-runner');
module.exports = TestRunner;
```

### Configuration Patterns
```javascript
// ✅ Multiple configuration methods
const config = new TestConfig({
  testFiles: ['/tests/page.test.html'],
  autoRun: true
});

const config = await TestConfig.fromElement(); // From DOM
const config = await TestConfig.fromUrl('/config.json'); // From URL
```

### Test File Structure
```html
<!-- ✅ Self-contained HTML test files -->
<!DOCTYPE html>
<html>
<head>
    <title>My Test</title>
</head>
<body>
    <div id="app">Content to test</div>
    
    <script type="module">
        test('should have content', () => {
            assert.exists('#app');
            assert.text('#app', 'Content to test');
        });
    </script>
</body>
</html>
```

### Web Component Lifecycle
```javascript
// ✅ Proper custom element timing
document.addEventListener('DOMContentLoaded', async () => {
    await customElements.whenDefined('test-output');
    await runTests();
});
```

## Code Quality Standards

### JavaScript Guidelines
- ES modules run in strict mode automatically (no need for `'use strict';`)
- Implement proper error handling with try/catch blocks
- Follow consistent naming conventions (camelCase for variables/functions)
- Use const/let appropriately, never var
- Implement proper async/await patterns for asynchronous operations
- Use native browser APIs over polyfills

### CSS Guidelines
- Use CSS Custom Properties for theming
- Implement responsive design with CSS Grid and Flexbox
- Avoid vendor prefixes unless absolutely necessary
- Follow Swiss/Dieter Rams design principles: minimal, functional, clean

### HTML Guidelines
- Use semantic HTML5 elements
- Implement proper accessibility attributes (ARIA labels, roles)
- Ensure valid markup (validate with W3C validator)
- Use progressive enhancement principles

## Testing Framework Usage

### For Framework Development
- Use the original `test-framework.js` for testing the framework itself
- Tests are embedded in the HTML pages served by Architect

### For End Users
- Use the generalized `test-runner.js` to load external HTML test files
- Configure test sources via `TestConfig`
- HTML test files contain their own test definitions

### CI/CD Integration
```javascript
// ✅ Programmatic usage for CI
const config = new TestConfig({
  testFiles: ['https://myapp.com/tests/*.test.html'],
  ciMode: true
});

const runner = new TestRunner(config);
const results = await runner.runAllTests();

if (!results.success) {
  process.exit(1); // Fail the CI build
}
```

## Deployment Considerations

### Architect Deployment
- Use `arc deploy` for production deployments
- Static files automatically deployed to S3 and served via CloudFront
- Lambda functions handle dynamic routing
- Monitor serverless function performance

### Browser Compatibility
- Target modern browsers with native ES Module support
- Implement feature detection where necessary
- Provide graceful degradation for unsupported features
- Test across multiple browser engines

## Development Workflow

1. **Setup**: Initialize Architect project with `arc init`
2. **Development**: Use `arc sandbox` for local development
3. **Module Organization**: Structure ES Modules in logical directories
4. **Component Development**: Build Custom Elements following web standards
5. **Testing**: Test in multiple browsers with native ES Module loading
6. **Configuration**: Use the configuration system for flexible test sources
7. **Code Review**: **ALWAYS** use the web standards code review agent to review code before staging any pull request
8. **Deployment**: Deploy via Architect to AWS serverless infrastructure

## Code Review Requirements

**MANDATORY**: Before staging any pull request, you MUST:

1. **Use the web standards reviewer agent** to review all code changes
2. **Address all critical and high-priority issues** identified by the reviewer
3. **Implement recommended security fixes** before proceeding
4. **Ensure accessibility compliance** meets WCAG standards
5. **Verify browser compatibility** across target browsers
6. **Fix any web standards violations** before submission

This ensures code quality, security, and standards compliance in every release.

## Forbidden Practices

❌ **Never Use:**
- Any JavaScript frameworks (React, Vue, Angular, etc.)
- Build tools or transpilers (Webpack, Vite, etc.)
- CommonJS syntax anywhere in the project
- NPM packages that require bundling
- Non-standard web APIs or polyfills
- Custom Lambda routes for static file serving

✅ **Always Use:**
- Native web platform APIs
- ES Module syntax exclusively
- Standards-compliant HTML/CSS/JavaScript
- Custom Elements for component architecture
- Architect for serverless backend functionality
- Architect's built-in static file serving

## Resources

- [MDN Web Docs](https://developer.mozilla.org/en-US/) - Primary reference
- [Architect Documentation](https://arc.codes) - Serverless framework guide
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) - Custom Elements reference
- [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - Module system guide
- [CustomElements.whenDefined()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined) - Component readiness
- [TAP Specification](https://testanything.org/) - Test output format

---

**Remember**: This project prioritizes web standards, native browser capabilities, serverless architecture, and **generalized, configurable testing solutions**. Every technical decision must align with these core principles while maintaining the flexibility for users to test HTML applications from any source.