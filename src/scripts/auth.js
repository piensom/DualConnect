// Authentication handling
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('errorMessage');

      try {
        const data = await api.login(email, password);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorMessage.textContent = error.message || 'Login failed. Please check your credentials.';
        errorMessage.style.display = 'block';
      }
    });
  }

  // Register form handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm_password').value;
      const errorMessage = document.getElementById('errorMessage');

      // Validate passwords match
      if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.style.display = 'block';
        return;
      }

      const userData = {
        email: document.getElementById('email').value,
        password: password,
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        country_of_origin: document.getElementById('country_of_origin').value,
        phone: document.getElementById('phone').value,
        preferred_language: document.getElementById('preferred_language').value
      };

      try {
        const data = await api.register(userData);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorMessage.textContent = error.message || 'Registration failed. Please try again.';
        errorMessage.style.display = 'block';
      }
    });
  }
});
