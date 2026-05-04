document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
            window.location.href = '/user_login.html';
            return;
        }
        const data = await res.json();

        const user = data.user;
        const orders = data.orders;

        document.getElementById('user-info').innerHTML = `Добре дошли обратно, <strong>${user.full_name}</strong>! (${user.email})`;

        const ordersContainer = document.getElementById('orders-container');
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = '<p class="text">Все още нямате поръчки. Отидете в <a href="/menu.html" style="color: var(--primary);">Менюто</a>, за да поръчате първото си смути!</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map((o, idx) => {
            const sizeLabel = o.size === 'small' ? 'Малка' : o.size === 'large' ? 'Голяма' : 'Средна';
            const statusBadge = o.status === 'pending'
                ? '<span style="background:#fdf6b2; color:#c27803; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">В Изчакване</span>'
                : '<span style="background:#def7ec; color:#03543f; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">Завършена</span>';
            const customBadge = o.is_custom
                ? '<span style="font-size:0.8rem; background:var(--secondary); color:#fff; padding:2px 6px; border-radius:12px; margin-left:5px;">Персонализирано</span>'
                : '';

            const ingredientRows = (o.ingredients || []).map(i =>
                `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0; border-bottom:1px solid #f0f0f0; font-size:0.875rem;">
                    <span>${i.emoji}</span>
                    <span style="flex:1;">${i.name}</span>
                    <span style="color:#888;">${i.grams}g</span>
                </div>`
            ).join('');

            const macros = `
                <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; margin-top:0.75rem;">
                    <div style="text-align:center; background:#f9fafb; border-radius:8px; padding:0.5rem;">
                        <div style="font-weight:700; font-size:1rem;">${Math.round(o.total_calories)}</div>
                        <div style="font-size:0.7rem; color:#888; text-transform:uppercase;">ккал</div>
                    </div>
                    <div style="text-align:center; background:#f9fafb; border-radius:8px; padding:0.5rem;">
                        <div style="font-weight:700; font-size:1rem;">${o.total_protein.toFixed(1)}g</div>
                        <div style="font-size:0.7rem; color:#888; text-transform:uppercase;">Протеин</div>
                    </div>
                    <div style="text-align:center; background:#f9fafb; border-radius:8px; padding:0.5rem;">
                        <div style="font-weight:700; font-size:1rem;">${o.total_carbs.toFixed(1)}g</div>
                        <div style="font-size:0.7rem; color:#888; text-transform:uppercase;">Въглехидрати</div>
                    </div>
                    <div style="text-align:center; background:#f9fafb; border-radius:8px; padding:0.5rem;">
                        <div style="font-weight:700; font-size:1rem;">${o.total_fat.toFixed(1)}g</div>
                        <div style="font-size:0.7rem; color:#888; text-transform:uppercase;">Мазнини</div>
                    </div>
                </div>`;

            return `
            <div style="background:white; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); margin-bottom:1rem; overflow:hidden;">
                <div style="padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <div style="font-size:1.05rem; font-weight:700;">${o.smoothie_name}${customBadge}</div>
                        <div style="color:#888; font-size:0.82rem; margin-top:2px;">${o.created_at} &middot; ${sizeLabel} &middot; ${statusBadge}</div>
                    </div>
                    <button class="btn" data-idx="${idx}" style="padding:0.4rem 1rem; font-size:0.875rem; white-space:nowrap;">Поръчай Отново</button>
                </div>
                ${ingredientRows ? `
                <div style="padding:0 1.25rem 0.75rem;">
                    <div style="font-size:0.72rem; font-weight:600; color:#555; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.35rem;">Съставки</div>
                    ${ingredientRows}
                    ${macros}
                </div>` : ''}
            </div>`;
        }).join('');

        ordersContainer.querySelectorAll('[data-idx]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const o = orders[+btn.dataset.idx];
                btn.disabled = true;
                btn.textContent = 'Поръчва се...';
                try {
                    let res;
                    if (o.is_custom) {
                        const liquid = o.ingredients.find(i => i.is_liquid);
                        const fruits = o.ingredients.filter(i => !i.is_liquid);
                        res = await fetch('/api/custom', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                size: o.size,
                                liquid_id: liquid.id,
                                ingredients: JSON.stringify(fruits.map(i => ({ id: i.id, grams: i.grams }))),
                                customer_name: null,
                            }),
                        });
                    } else {
                        res = await fetch('/api/order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ smoothie_id: o.smoothie_id, size: o.size, customer_name: null }),
                        });
                    }
                    const result = await res.json();
                    if (result.success) {
                        btn.textContent = 'Поръчано!';
                        btn.style.background = '#059669';
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        btn.textContent = 'Грешка';
                        btn.disabled = false;
                    }
                } catch(e) {
                    console.error(e);
                    btn.textContent = 'Грешка';
                    btn.disabled = false;
                }
            });
        });

    } catch(e) {
        console.error("Profile load failed", e);
        document.getElementById('user-info').innerHTML = 'Грешка при зареждане';
    }
});
