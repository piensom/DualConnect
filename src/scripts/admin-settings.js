if (!localStorage.getItem('admin_token')) location.href='login.html';

document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const settings = {
    siteName: document.getElementById('siteName').value,
    adminEmail: document.getElementById('adminEmail').value,
    maxUpload: document.getElementById('maxUpload').value,
    maintenanceMode: document.getElementById('maintenanceMode').checked
  };
  localStorage.setItem('platform_settings', JSON.stringify(settings));
  showToast('Settings saved successfully', 'success');
});

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.remove(), 3000);
}

function logout() { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }}
