class TestOutput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.lines = [];
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      running: false
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    document.removeEventListener('tap-start', this.handleTestStart);
    document.removeEventListener('tap-output', this.handleTapOutput);
    document.removeEventListener('tap-pass', this.handleTestPass);
    document.removeEventListener('tap-fail', this.handleTestFail);
    document.removeEventListener('tap-finish', this.handleTestFinish);
  }

  setupEventListeners() {
    document.addEventListener('tap-start', (event) => {
      this.handleTestStart(event.detail);
    });

    document.addEventListener('tap-output', (event) => {
      this.handleTapOutput(event.detail);
    });

    document.addEventListener('tap-pass', (event) => {
      this.handleTestPass(event.detail);
    });

    document.addEventListener('tap-fail', (event) => {
      this.handleTestFail(event.detail);
    });

    document.addEventListener('tap-finish', (event) => {
      this.handleTestFinish(event.detail);
    });
  }

  handleTestStart(detail) {
    this.testResults.total = detail.totalTests;
    this.testResults.passed = 0;
    this.testResults.failed = 0;
    this.testResults.running = true;
    this.lines = [];
    this.updateStatus();
    this.updateOutput();
  }

  handleTapOutput(detail) {
    this.lines.push(detail.line);
    this.updateOutput();
  }

  handleTestPass(detail) {
    this.testResults.passed++;
    this.updateStatus();
  }

  handleTestFail(detail) {
    this.testResults.failed++;
    this.updateStatus();
  }

  handleTestFinish(detail) {
    this.testResults.running = false;
    this.updateStatus();
  }

  updateStatus() {
    const statusElement = this.shadowRoot.querySelector('.status');
    const progressElement = this.shadowRoot.querySelector('.progress-bar');

    if (this.testResults.running) {
      const completed = this.testResults.passed + this.testResults.failed;
      const percentage = this.testResults.total > 0 ? (completed / this.testResults.total) * 100 : 0;

      statusElement.textContent = `Running: ${completed}/${this.testResults.total}`;
      statusElement.className = 'status running';
      progressElement.style.width = `${percentage}%`;
    } else {
      const success = this.testResults.failed === 0;
      const statusText = success
        ? `✓ All tests passed (${this.testResults.passed}/${this.testResults.total})`
        : `✗ ${this.testResults.failed} of ${this.testResults.total} tests failed`;
      
      statusElement.textContent = statusText;
      statusElement.className = success ? 'status success' : 'status failure';
      progressElement.style.width = '100%';
      
      // Announce test completion to screen readers
      this.announceToScreenReader(statusText);
    }
  }

  announceToScreenReader(message) {
    // Create temporary announcement element for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.style.position = 'absolute';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.padding = '0';
    announcement.style.margin = '-1px';
    announcement.style.overflow = 'hidden';
    announcement.style.clip = 'rect(0, 0, 0, 0)';
    announcement.style.whiteSpace = 'nowrap';
    announcement.style.border = '0';
    announcement.textContent = message;
    
    this.shadowRoot.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  updateOutput() {
    const outputElement = this.shadowRoot.querySelector('.output');
    outputElement.innerHTML = this.lines
      .map(line => this.formatLine(line))
      .join('');

    outputElement.scrollTop = outputElement.scrollHeight;
  }

  formatLine(line) {
    let className = 'line';

    if (line.startsWith('ok ')) {
      className += ' pass';
    } else if (line.startsWith('not ok ')) {
      className += ' fail';
    } else if (line.startsWith('#')) {
      className += ' summary';
    } else if (line.startsWith('TAP version') || line.match(/^\d+\.\.\d+$/)) {
      className += ' meta';
    } else if (line.startsWith('  ')) {
      className += ' detail';
    }

    return `<div class="${className}">${this.escapeHtml(line)}</div>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clear() {
    this.lines = [];
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      running: false
    };
    this.updateStatus();
    this.updateOutput();
  }

  render() {
    this.shadowRoot.innerHTML = `
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
        <div class="status" role="status" aria-live="polite" aria-atomic="true">Ready</div>
        <div class="progress">
          <div class="progress-bar"></div>
        </div>
      </div>
      
      <div class="output" role="log" aria-label="Test execution output" aria-live="polite">
        <div class="empty-state">No test output yet. Click "Run Tests" to begin.</div>
      </div>
    `;
  }
}

customElements.define('test-output', TestOutput);
