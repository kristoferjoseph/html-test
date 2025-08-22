export async function handler() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Test Runner</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✅</text></svg>">
    <link rel="stylesheet" href="/_static/styles/test.css">
</head>
<body>
    <header class="header">
        <h1>HTML Test Runner</h1>
        <div class="test-controls">
            <button id="run-tests" class="run-button" aria-label="Run all tests">Run Tests</button>
            <button id="clear-output" class="clear-button" aria-label="Clear test output">Clear</button>
        </div>
    </header>

    <main class="main">
        <section class="test-area" aria-labelledby="test-content-heading">
            <h2 id="test-content-heading">Test Content</h2>
            <div id="test-content">
                <p id="test-paragraph">This is a test paragraph.</p>
                <button id="test-button" disabled>Test Button</button>
                <input id="test-input" type="text" value="test value">
                <div class="hidden-element" style="display: none;">Hidden Element</div>
                <ul id="test-list">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li class="special">Item 3</li>
                </ul>
            </div>
        </section>

        <section class="output-area" aria-labelledby="test-output-heading">
          <test-output id="test-output" role="log" aria-live="polite" aria-label="Test results output"></test-output>
        </section>
    </main>

    <script type="module" src="/_static/js/main.js"></script>
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
