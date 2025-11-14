if (!localStorage.getItem('admin_token')) location.href='login.html';
let faqs = Array.from({length:15}, (_, i) => ({faq_id:i+1, question:`FAQ Question ${i+1}?`, category:['Application','Visa','General'][i%3]}));
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('faqTableBody').innerHTML = faqs.map(f => `
    <tr><td>${f.faq_id}</td><td>${f.question}</td><td>${f.category}</td>
    <td><button class="btn-icon edit" onclick="editFAQ(${f.faq_id})">✏️</button>
    <button class="btn-icon delete" onclick="deleteFAQ(${f.faq_id})">🗑️</button></td></tr>
  `).join('');
});
function addFAQ() { alert('Add FAQ form'); }
function editFAQ(id) { alert(`Edit FAQ ${id}`); }
function deleteFAQ(id) { if(confirm('Delete?')) { faqs = faqs.filter(f => f.faq_id !== id); location.reload(); }}
function logout() { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }}
