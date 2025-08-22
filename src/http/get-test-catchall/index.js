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
            <button id="run-tests" class="run-button" aria-label="Run all tests">Run Tests</button>
            <button id="clear-output" class="clear-button" aria-label="Clear test output">Clear</button>
            <a href="/" class="back-link" aria-label="Return to main test page">← Back to Main</a>
        </div>
    </header>
    
    <main class="main">
        <section class="test-area" aria-labelledby="test-content-heading">
            <h2 id="test-content-heading">Test Content for ${testPath}</h2>
            <div id="test-content">
                <!-- Dynamic test content will be loaded here -->
                <p>Test content for ${testPath} will be loaded here.</p>
            </div>
        </section>
        
        <section class="output-area" aria-labelledby="test-output-heading">
            <test-output id="test-output" role="log" aria-live="polite" aria-label="Test results output"></test-output>
        </section>
    </main>

    <script type="module" src="/_static/js/test-page.js"></script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self' ws://localhost:2222;"
    },
    body: html
  };
}