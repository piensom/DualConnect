// Form Validation Utilities

class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = {};
    this.rules = {};
    this.customMessages = {};
  }

  // Add validation rule for a field
  addRule(fieldName, rules) {
    this.rules[fieldName] = rules;
    return this;
  }

  // Set custom error message
  setMessage(fieldName, ruleName, message) {
    if (!this.customMessages[fieldName]) {
      this.customMessages[fieldName] = {};
    }
    this.customMessages[fieldName][ruleName] = message;
    return this;
  }

  // Validate single field
  validateField(fieldName, value) {
    const fieldRules = this.rules[fieldName];
    if (!fieldRules) return true;

    const errors = [];

    // Required validation
    if (fieldRules.required && !value) {
      errors.push(this.getMessage(fieldName, 'required', 'This field is required'));
    }

    // Skip other validations if field is empty and not required
    if (!value && !fieldRules.required) {
      return errors.length === 0;
    }

    // Email validation
    if (fieldRules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(this.getMessage(fieldName, 'email', 'Please enter a valid email address'));
      }
    }

    // Min length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors.push(this.getMessage(fieldName, 'minLength',
        `Minimum ${fieldRules.minLength} characters required`));
    }

    // Max length validation
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors.push(this.getMessage(fieldName, 'maxLength',
        `Maximum ${fieldRules.maxLength} characters allowed`));
    }

    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors.push(this.getMessage(fieldName, 'pattern', 'Invalid format'));
    }

    // Number validation
    if (fieldRules.number && isNaN(value)) {
      errors.push(this.getMessage(fieldName, 'number', 'Please enter a valid number'));
    }

    // Min value validation
    if (fieldRules.min !== undefined && parseFloat(value) < fieldRules.min) {
      errors.push(this.getMessage(fieldName, 'min',
        `Minimum value is ${fieldRules.min}`));
    }

    // Max value validation
    if (fieldRules.max !== undefined && parseFloat(value) > fieldRules.max) {
      errors.push(this.getMessage(fieldName, 'max',
        `Maximum value is ${fieldRules.max}`));
    }

    // Custom validation
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    // Match field validation (for password confirmation)
    if (fieldRules.matches) {
      const matchField = this.form.querySelector(`[name="${fieldRules.matches}"]`);
      if (matchField && value !== matchField.value) {
        errors.push(this.getMessage(fieldName, 'matches', 'Fields do not match'));
      }
    }

    if (errors.length > 0) {
      this.errors[fieldName] = errors;
      return false;
    }

    delete this.errors[fieldName];
    return true;
  }

  // Get error message
  getMessage(fieldName, ruleName, defaultMessage) {
    return this.customMessages[fieldName]?.[ruleName] || defaultMessage;
  }

  // Validate entire form
  validate() {
    this.errors = {};
    let isValid = true;

    // Get all form fields
    const formData = new FormData(this.form);

    // Validate each field with rules
    for (const fieldName in this.rules) {
      const value = formData.get(fieldName) || '';
      if (!this.validateField(fieldName, value)) {
        isValid = false;
      }
    }

    return isValid;
  }

  // Get all errors
  getErrors() {
    return this.errors;
  }

  // Get errors for specific field
  getFieldErrors(fieldName) {
    return this.errors[fieldName] || [];
  }

  // Display errors in the form
  displayErrors() {
    // Clear previous errors
    this.clearErrors();

    // Display new errors
    for (const fieldName in this.errors) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;

      // Add error class to field
      field.classList.add('error');

      // Create error message element
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = this.errors[fieldName][0]; // Show first error

      // Insert error after field
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
  }

  // Clear all error displays
  clearErrors() {
    // Remove error classes
    this.form.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });

    // Remove error messages
    this.form.querySelectorAll('.field-error').forEach(el => {
      el.remove();
    });
  }

  // Setup real-time validation
  setupRealTimeValidation() {
    for (const fieldName in this.rules) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;

      field.addEventListener('blur', () => {
        const value = field.value;
        this.validateField(fieldName, value);
        this.displayErrors();
      });

      field.addEventListener('input', () => {
        // Clear error on input
        if (this.errors[fieldName]) {
          delete this.errors[fieldName];
          this.displayErrors();
        }
      });
    }
  }
}

// Validation helper functions

// Email validation
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Phone validation (German format)
const isValidPhone = (phone) => {
  const regex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return regex.test(phone);
};

// Password strength validation
const isStrongPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// URL validation
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date validation
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// German postal code validation
const isValidGermanPostalCode = (postalCode) => {
  const regex = /^\d{5}$/;
  return regex.test(postalCode);
};

// File size validation
const isValidFileSize = (file, maxSizeMB) => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  return file.size <= maxSize;
};

// File type validation
const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormValidator,
    isValidEmail,
    isValidPhone,
    isStrongPassword,
    isValidURL,
    isValidDate,
    isValidGermanPostalCode,
    isValidFileSize,
    isValidFileType
  };
}

// Example usage:
/*
const form = document.getElementById('myForm');
const validator = new FormValidator(form);

validator
  .addRule('email', {
    required: true,
    email: true
  })
  .addRule('password', {
    required: true,
    minLength: 8,
    custom: (value) => {
      if (!isStrongPassword(value)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
    }
  })
  .addRule('confirmPassword', {
    required: true,
    matches: 'password'
  })
  .setMessage('email', 'required', 'E-Mail ist erforderlich')
  .setMessage('email', 'email', 'Bitte geben Sie eine gültige E-Mail ein');

// Setup real-time validation
validator.setupRealTimeValidation();

// Validate on submit
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (validator.validate()) {
    console.log('Form is valid!');
    // Submit form
  } else {
    validator.displayErrors();
  }
});
*/
