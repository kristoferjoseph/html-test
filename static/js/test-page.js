import { test, runTests, assert } from '/_static/modules/test-framework.js';
import '/_static/components/test-output.js';

// Get the test path from the page title
const testPath = document.title.replace('Test: ', '');

// Example test for this specific path
test(`should load test page for ${testPath}`, () => {
    assert.exists('#test-content');
});

test('should have correct title', () => {
    assert.text('h1', `Test: ${testPath}`);
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