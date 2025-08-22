/**
 * Browser Assertions Library
 * A standalone assertion library for DOM testing in browsers
 * Uses native browser APIs with zero dependencies
 */

class AssertionError extends Error {
  constructor(message, actual = null, expected = null) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export class BrowserAssertions {
  constructor() {
    this.name = 'BrowserAssertions';
    this.version = '1.0.0';
  }

  exists(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new AssertionError(`Element not found: ${selector}`);
    }
    return element;
  }

  notExists(selector) {
    const element = document.querySelector(selector);
    if (element) {
      throw new AssertionError(`Element should not exist: ${selector}`);
    }
    return true;
  }

  text(selector, expectedText) {
    const element = this.exists(selector);
    const actualText = element.textContent.trim();

    if (actualText !== expectedText) {
      throw new AssertionError(
        `Text mismatch for ${selector}`,
        actualText,
        expectedText
      );
    }
    return true;
  }

  textContains(selector, expectedText) {
    const element = this.exists(selector);
    const actualText = element.textContent.trim();

    if (!actualText.includes(expectedText)) {
      throw new AssertionError(
        `Text does not contain "${expectedText}" for ${selector}`,
        actualText,
        `text containing "${expectedText}"`
      );
    }
    return true;
  }

  attribute(selector, attributeName, expectedValue) {
    const element = this.exists(selector);
    const actualValue = element.getAttribute(attributeName);

    if (actualValue !== expectedValue) {
      throw new AssertionError(
        `Attribute ${attributeName} mismatch for ${selector}`,
        actualValue,
        expectedValue
      );
    }
    return true;
  }

  hasAttribute(selector, attributeName) {
    const element = this.exists(selector);

    if (!element.hasAttribute(attributeName)) {
      throw new AssertionError(`Element ${selector} should have attribute ${attributeName}`);
    }
    return true;
  }

  notHasAttribute(selector, attributeName) {
    const element = this.exists(selector);

    if (element.hasAttribute(attributeName)) {
      throw new AssertionError(`Element ${selector} should not have attribute ${attributeName}`);
    }
    return true;
  }

  visible(selector) {
    const element = this.exists(selector);
    const style = window.getComputedStyle(element);

    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      throw new AssertionError(`Element ${selector} should be visible`);
    }
    return true;
  }

  hidden(selector) {
    const element = this.exists(selector);
    const style = window.getComputedStyle(element);

    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      throw new AssertionError(`Element ${selector} should be hidden`);
    }
    return true;
  }

  disabled(selector) {
    const element = this.exists(selector);

    if (!element.disabled && !element.hasAttribute('disabled')) {
      throw new AssertionError(`Element ${selector} should be disabled`);
    }
    return true;
  }

  enabled(selector) {
    const element = this.exists(selector);

    if (element.disabled || element.hasAttribute('disabled')) {
      throw new AssertionError(`Element ${selector} should be enabled`);
    }
    return true;
  }

  count(selector, expectedCount) {
    const elements = document.querySelectorAll(selector);
    const actualCount = elements.length;

    if (actualCount !== expectedCount) {
      throw new AssertionError(
        `Element count mismatch for ${selector}`,
        actualCount,
        expectedCount
      );
    }
    return true;
  }

  hasClass(selector, className) {
    const element = this.exists(selector);

    if (!element.classList.contains(className)) {
      throw new AssertionError(`Element ${selector} should have class ${className}`);
    }
    return true;
  }

  notHasClass(selector, className) {
    const element = this.exists(selector);

    if (element.classList.contains(className)) {
      throw new AssertionError(`Element ${selector} should not have class ${className}`);
    }
    return true;
  }

  value(selector, expectedValue) {
    const element = this.exists(selector);
    const actualValue = element.value;

    if (actualValue !== expectedValue) {
      throw new AssertionError(
        `Value mismatch for ${selector}`,
        actualValue,
        expectedValue
      );
    }
    return true;
  }

  checked(selector) {
    const element = this.exists(selector);

    if (!element.checked) {
      throw new AssertionError(`Element ${selector} should be checked`);
    }
    return true;
  }

  notChecked(selector) {
    const element = this.exists(selector);

    if (element.checked) {
      throw new AssertionError(`Element ${selector} should not be checked`);
    }
    return true;
  }

  matches(selector, cssSelector) {
    const element = this.exists(selector);

    if (!element.matches(cssSelector)) {
      throw new AssertionError(`Element ${selector} should match CSS selector ${cssSelector}`);
    }
    return true;
  }

  isEqual(actual, expected) {
    if (actual !== expected) {
      throw new AssertionError(
        'Values are not equal',
        actual,
        expected
      );
    }
    return true;
  }

  isTrue(value) {
    if (value !== true) {
      throw new AssertionError(
        'Value should be true',
        value,
        true
      );
    }
    return true;
  }

  isFalse(value) {
    if (value !== false) {
      throw new AssertionError(
        'Value should be false',
        value,
        false
      );
    }
    return true;
  }

  throws(fn, expectedError = null) {
    let thrownError = null;

    try {
      fn();
    } catch (error) {
      thrownError = error;
    }

    if (!thrownError) {
      throw new AssertionError('Function should have thrown an error');
    }

    if (expectedError && thrownError.constructor !== expectedError) {
      throw new AssertionError(
        'Function threw wrong error type',
        thrownError.constructor.name,
        expectedError.name
      );
    }

    return true;
  }
}

// Export singleton instance for convenience
export const assert = new BrowserAssertions();

// Export error class for custom error handling
export { AssertionError };
