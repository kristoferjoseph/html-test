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