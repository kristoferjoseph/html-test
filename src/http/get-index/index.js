export async function handler() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Test Runner</title>
    <link rel="stylesheet" href="/_static/styles/test.css">
</head>
<body>
    <header class="header">
        <h1>HTML Test Runner</h1>
        <div class="test-controls">
            <button id="run-tests" class="run-button">Run Tests</button>
            <button id="clear-output" class="clear-button">Clear</button>
        </div>
    </header>

    <main class="main">
        <section class="test-area">
            <h2>Test Content</h2>
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

        <section class="output-area">
          <test-output id="test-output">
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
                  color: #6c757d;
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
                  color: #495057;
                  background: #f8f9fa;
                  border-left-color: #6c757d;
                }

                .line.meta {
                  color: #6c757d;
                  font-style: italic;
                }

                .line.detail {
                  color: #6c757d;
                  background: #f8f9fa;
                  font-size: 12px;
                }

                .empty-state {
                  padding: 32px 16px;
                  text-align: center;
                  color: #6c757d;
                }
              </style>

              <div class="header">
                <div class="status">Ready</div>
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

    <script type="module">
        import { test, runTests, assert } from '/_static/modules/test-framework.js';
        import '/_static/components/test-output.js';

        // Example tests
        test('should find test paragraph', () => {
            assert.exists('#test-paragraph');
        });

        test('should verify paragraph text', () => {
            assert.text('#test-paragraph', 'This is a test paragraph.');
        });

        test('should check button is disabled', () => {
            assert.disabled('#test-button');
        });

        test('should verify input value', () => {
            assert.value('#test-input', 'test value');
        });

        test('should count list items', () => {
            assert.count('#test-list li', 3);
        });

        test('should check element has class', () => {
            assert.hasClass('#test-list .special', 'special');
        });

        test('should verify hidden element', () => {
            assert.hidden('.hidden-element');
        });

        test('async test example', async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            assert.exists('#test-content');
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
