document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/admin');
        if (!res.ok) {
            window.location.href = '/login.html';
            return;
        }
        
        const data = await res.json();
        renderOrders(data.orders);
        
        if (data.is_superadmin) {
            document.getElementById('superadmin-panel').style.display = 'block';
            renderAdmins(data.admins);
            setupSuperadminListeners();
        }
    } catch(e) {
        console.error("Admin data fetch failed", e);
    }
});

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    if (orders.length === 0) {
        container.innerHTML = '<div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; color: var(--text-muted);">В момента няма чакащи поръчки. Отпуснете се! ☕</div>';
        return;
    }
    
    container.innerHTML = orders.map(o => {
        let sizeText = o.size;
        if (sizeText === 'small') sizeText = 'Малка';
        else if (sizeText === 'medium') sizeText = 'Средна';
        else if (sizeText === 'large') sizeText = 'Голяма';
        
        const isCustom = o.is_custom ? '<span style="font-size: 0.8rem; background: var(--secondary); color:#fff; padding: 2px 6px; border-radius:12px; margin-left: 5px;">Персонализирано</span>' : '';
        const userMark = o.user_id ? '<span style="font-size: 0.8rem; background: #e0e0e0; color:#333; padding: 2px 6px; border-radius:12px;">Регистриран</span>' : '<span style="font-size: 0.8rem; background: #ffecb3; color:#795548; padding: 2px 6px; border-radius:12px;">Гост</span>';
        
        return `
        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 1rem; border-left: 5px solid #d97706;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h3 style="margin: 0 0 5px 0;">Поръчка #${o.id}</h3>
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9rem;">От: <strong>${o.customer_name || 'Неизвестен'}</strong> ${userMark}</p>
                    <div style="font-size: 1.1rem; margin-bottom: 5px;">
                        <strong>${o.smoothie_name}</strong> ${isCustom}
                    </div>
                    <div style="color: #666; text-transform: capitalize;">Размер: ${sizeText}</div>
                    <div style="color: #888; font-size: 0.85rem; margin-top: 5px;">${o.created_at}</div>
                </div>
                <div>
                    <form onsubmit="completeOrder(event, ${o.id})">
                        <button type="submit" class="btn" style="padding: 0.5rem 1rem; background: #059669;">Маркирай като Готова ✓</button>
                    </form>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

window.completeOrder = async function(e, id) {
    e.preventDefault();
    try {
        await fetch('/api/admin/order/' + id + '/complete', { method: 'POST' });
        window.location.reload();
    } catch(e) { console.error(e); }
}

function renderAdmins(admins) {
    const list = document.getElementById('admins-list');
    list.innerHTML = admins.map(a => `
        <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: #fafafa; border: 1px solid #eaeaea; border-radius: 4px;">
          <span>
            <strong>${a.username}</strong>
            ${a.is_superadmin ? '<span style="color: #d32f2f; font-size: 0.8rem; font-weight: bold; margin-left: 5px;">[SUPER]</span>' : ''}
          </span>
          <form onsubmit="deleteAdmin(event, ${a.id})">
            <button type="submit" style="background: none; border: none; color: #d32f2f; cursor: pointer; text-decoration: underline; font-size: 0.8rem;">Изтрий</button>
          </form>
        </li>
    `).join('');
}

window.deleteAdmin = async function(e, id) {
    e.preventDefault();
    if(!confirm("Сигурни ли сте?")) return;
    try {
        await fetch('/api/admin/delete/' + id, { method: 'POST' });
        window.location.reload();
    } catch(err) { console.error(err); }
}

function setupSuperadminListeners() {
    document.getElementById('new-admin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('new_admin_username').value,
            password: document.getElementById('new_admin_password').value,
            is_superadmin: document.getElementById('new_admin_super').checked
        };
        try {
            await fetch('/api/admin/new', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            window.location.reload();
        } catch(err) { console.error(err); }
    });
}
