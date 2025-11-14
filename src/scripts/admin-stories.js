if (!localStorage.getItem('admin_token')) location.href='login.html';
let stories = Array.from({length:10}, (_, i) => ({id:i+1, name:`Student ${i+1}`, country:['Germany','USA','Turkey'][i%3], featured:i<3}));
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('storiesBody').innerHTML = stories.map(s => `
    <tr><td>${s.id}</td><td>${s.name}</td><td>${s.country}</td><td>${s.featured?'✅':'❌'}</td>
    <td><button class="btn-icon" onclick="toggleFeatured(${s.id})">⭐</button>
    <button class="btn-icon delete" onclick="deleteStory(${s.id})">🗑️</button></td></tr>
  `).join('');
});
function toggleFeatured(id) { const s=stories.find(x=>x.id===id); if(s) s.featured=!s.featured; location.reload(); }
function deleteStory(id) { if(confirm('Delete?')) { stories=stories.filter(s=>s.id!==id); location.reload(); }}
function logout() { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }}
