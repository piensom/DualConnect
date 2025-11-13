// Blog Management
if (!localStorage.getItem('admin_token')) window.location.href = 'login.html';

let posts = Array.from({length: 20}, (_, i) => ({
  post_id: i+1, title: `Blog Post ${i+1}`, category: ['Career', 'Education', 'Tips'][i%3],
  author: 'Admin', date: new Date(Date.now() - i*86400000).toISOString().split('T')[0],
  status: ['published', 'draft'][i%2]
}));

document.addEventListener('DOMContentLoaded', displayPosts);

function displayPosts() {
  document.getElementById('postsTableBody').innerHTML = posts.map(p => `
    <tr><td>${p.post_id}</td><td><strong>${p.title}</strong></td><td>${p.category}</td><td>${p.author}</td>
    <td>${p.date}</td><td><span class="table-badge ${p.status==='published'?'success':'warning'}">${p.status}</span></td>
    <td><button class="btn-icon edit" onclick="editPost(${p.post_id})">✏️</button>
    <button class="btn-icon delete" onclick="deletePost(${p.post_id})">🗑️</button></td></tr>
  `).join('');
}

function searchPosts() {
  const term = document.getElementById('searchPosts').value.toLowerCase();
  const filtered = term ? posts.filter(p => p.title.toLowerCase().includes(term)) : posts;
  document.getElementById('postsTableBody').innerHTML = filtered.map(p => `
    <tr><td>${p.post_id}</td><td>${p.title}</td><td>${p.category}</td><td>${p.author}</td>
    <td>${p.date}</td><td><span class="table-badge ${p.status==='published'?'success':'warning'}">${p.status}</span></td>
    <td><button class="btn-icon" onclick="editPost(${p.post_id})">✏️</button></td></tr>
  `).join('');
}

function createPost() { window.location.href = '../blog-editor.html'; }
function editPost(id) { alert(`Edit post ${id}`); }
function deletePost(id) { if(confirm('Delete?')) { posts = posts.filter(p => p.post_id !== id); displayPosts(); }}
function logout() { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }}
