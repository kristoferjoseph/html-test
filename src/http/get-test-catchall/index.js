export async function handler(req) {
  const testPath = req.pathParameters?.proxy || 'default';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test: ${testPath}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✅</text></svg>">
    <link rel="stylesheet" href="/_static/styles/test.css">
</head>
<body>
    <header class="header">
        <h1>Test: ${testPath}</h1>
        <div class="test-controls">
            <button id="run-tests" class="run-button">Run Tests</button>
            <button id="clear-output" class="clear-button">Clear</button>
            <a href="/" class="back-link">← Back to Main</a>
        </div>
    </header>
    
    <main class="main">
        <section class="test-area">
            <h2>Test Content for ${testPath}</h2>
            <div id="test-content">
                <!-- Dynamic test content will be loaded here -->
                <p>Test content for ${testPath} will be loaded here.</p>
            </div>
        </section>
        
        <section class="output-area">
            <test-output id="test-output"></test-output>
        </section>
    </main>

    <script type="module">
        import { test, runTests, assert } from '/_static/modules/test-framework.js';
        import '/_static/components/test-output.js';

        // Example test for this specific path
        test('should load test page for ${testPath}', () => {
            assert.exists('#test-content');
        });

        test('should have correct title', () => {
            assert.text('h1', 'Test: ${testPath}');
        });

        async function runTestsWithButton() {
            const button = document.getElementById('run-tests');
            button.disabled = true;
            button.textContent = 'Running...';
            
            try {
                await runTests();
            } finally {
                button.disabled = false;
                button.textContent = 'Run Tests';
            }
        }

        // Auto-run when page loads
        document.addEventListener('DOMContentLoaded', async () => {
            await customElements.whenDefined('test-output');
            await runTestsWithButton();
        });

        // Event listeners
        document.getElementById('run-tests').addEventListener('click', runTestsWithButton);

        document.getElementById('clear-output').addEventListener('click', () => {
            const output = document.getElementById('test-output');
            output.clear();
        });
    </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    },
    body: html
  };
}