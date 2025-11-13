if (!localStorage.getItem('admin_token')) location.href='login.html';

// Chart.js Traffic Chart
document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('trafficChart');
  if (ctx && typeof Chart !== 'undefined') {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Page Views',
          data: [120, 150, 180, 220, 300, 250, 200],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } }
      }
    });
  }
});

function logout() { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }}
