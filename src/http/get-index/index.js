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

                .status.running {
                  color: #495057;
                }

                .status.success {
                  color: #28a745;
                }

                .status.failure {
                  color: #dc3545;
                }

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
                <div class="status" role="status" aria-live="polite">Ready</div>
                <div class="progress">
                  <div class="progress-bar"></div>
                </div>
              </div>

              <div class="output">
                <div class="empty-state">No test output yet. Click "Run Tests" to begin.</div>
              </div>
            </template>
          </test-output>
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
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; connect-src 'self' ws://localhost:2222;"
    },
    body: html
  };
}
