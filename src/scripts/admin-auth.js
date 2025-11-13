// Admin Authentication JavaScript

// Check if already logged in
if (localStorage.getItem('admin_token')) {
  window.location.href = 'dashboard.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  loginForm.addEventListener('submit', handleLogin);
});

// Handle login
async function handleLogin(e) {
  e.preventDefault();

  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');

  // Get form data
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  const remember = formData.get('remember');

  // Clear previous errors
  errorMessage.style.display = 'none';
  errorMessage.textContent = '';

  // Disable button
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    // Call admin login API
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        remember: !!remember
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Check if user is admin
    if (!data.user.is_admin) {
      throw new Error('You do not have admin privileges');
    }

    // Store auth data
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));

    // Show success message
    showToast('Login successful! Redirecting...', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);

    // Show error message
    errorMessage.textContent = error.message || 'Invalid email or password';
    errorMessage.style.display = 'block';

    // Re-enable button
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login to Admin Panel';

    // Demo login fallback (for development)
    if (email === 'admin@dualconnect.com' && password === 'admin123') {
      // Store demo admin data
      const demoAdmin = {
        user_id: 1,
        name: 'Admin User',
        email: 'admin@dualconnect.com',
        is_admin: true
      };

      localStorage.setItem('admin_token', 'demo_admin_token_123');
      localStorage.setItem('admin_user', JSON.stringify(demoAdmin));

      showToast('Demo login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  }
}

// Forgot password
function forgotPassword(e) {
  e.preventDefault();
  alert('Please contact the system administrator to reset your password.');
}

// Toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3000);
}
