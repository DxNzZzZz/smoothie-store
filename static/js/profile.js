document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
            window.location.href = '/user_login.html';
            return;
        }
        const data = await res.json();
        const user   = data.user;
        const orders = data.orders;

        document.getElementById('user-info').innerHTML =
            `Добре дошли обратно, <strong>${user.full_name}</strong>! (${user.email})`;

        const container = document.getElementById('orders-container');
        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="text">Все още нямате поръчки. Отидете в <a href="/menu" style="color:var(--emerald);">Менюто</a>, за да поръчате първото си смути!</p>';
            return;
        }

        // Group orders: same batch_id → one group; no batch_id → solo group per order
        const groups = [];
        const batchMap = {};
        for (const o of orders) {
            const key = o.batch_id || `__solo_${o.id}`;
            if (!batchMap[key]) {
                batchMap[key] = [];
                groups.push(batchMap[key]);
            }
            batchMap[key].push(o);
        }

        container.innerHTML = groups.map((group, gi) => renderGroup(group, gi)).join('');

        // Wire up "Поръчай Отново" buttons
        container.querySelectorAll('[data-group]').forEach(btn => {
            btn.addEventListener('click', () => reorderGroup(groups[+btn.dataset.group], btn));
        });

    } catch(e) {
        console.error("Profile load failed", e);
        document.getElementById('user-info').innerHTML = 'Грешка при зареждане';
    }
});

/* ── Render a group (one card) ─────────────────────────────── */
function renderGroup(group, gi) {
    const isBatch  = group.length > 1;
    const latest   = group[0]; // orders are DESC, so first = most recent
    const status   = group.every(o => o.status === 'completed') ? 'completed' : 'pending';
    const statusBadge = status === 'pending'
        ? '<span class="order-badge order-badge-pending">В Изчакване</span>'
        : '<span class="order-badge order-badge-done">Завършена</span>';

    const totalCal     = group.reduce((s, o) => s + o.total_calories, 0);
    const totalProtein = group.reduce((s, o) => s + o.total_protein,  0);
    const totalCarbs   = group.reduce((s, o) => s + o.total_carbs,    0);
    const totalFat     = group.reduce((s, o) => s + o.total_fat,      0);

    const itemsHtml = group.map(o => renderOrderItem(o)).join('');

    const macrosHtml = `
        <div class="order-macros">
            <div class="order-macro"><div class="order-macro-val">${Math.round(totalCal)}</div><div class="order-macro-lbl">ккал</div></div>
            <div class="order-macro"><div class="order-macro-val">${totalProtein.toFixed(1)}г</div><div class="order-macro-lbl">Протеин</div></div>
            <div class="order-macro"><div class="order-macro-val">${totalCarbs.toFixed(1)}г</div><div class="order-macro-lbl">Въглехидрати</div></div>
            <div class="order-macro"><div class="order-macro-val">${totalFat.toFixed(1)}г</div><div class="order-macro-lbl">Мазнини</div></div>
        </div>`;

    return `
    <div class="order-card">
        <div class="order-card-header">
            <div>
                <div class="order-card-title">
                    ${isBatch ? `<strong>Поръчка (${group.length} смутита)</strong>` : `${emojiImg(latest.smoothie_emoji, latest.smoothie_name)} ${latest.smoothie_name}`}
                    ${latest.is_custom && !isBatch ? '<span class="order-custom-badge">Персонализирано</span>' : ''}
                </div>
                <div class="order-card-meta">${latest.created_at} &middot; ${statusBadge}</div>
            </div>
            <button class="btn order-reorder-btn" data-group="${gi}">Поръчай Отново</button>
        </div>
        <div class="order-card-body">
            ${itemsHtml}
            ${isBatch ? `<div class="order-batch-totals-label">Общо за поръчката</div>` : ''}
            ${macrosHtml}
        </div>
    </div>`;
}

/* ── Render one smoothie row inside a group card ───────────── */
function renderOrderItem(o) {
    const sizeLabel = o.size === 'small' ? 'Малка' : o.size === 'large' ? 'Голяма' : 'Средна';
    const customBadge = o.is_custom ? '<span class="order-custom-badge">Персонализирано</span>' : '';
    const ingredientRows = (o.ingredients || []).map(i =>
        `<div class="order-ingredient">
            <span>${emojiImg(i.emoji, i.name)}</span>
            <span style="flex:1;">${i.name}</span>
            <span style="color:var(--text-muted);">${i.grams}г</span>
        </div>`
    ).join('');

    return `
    <div class="order-item">
        <div class="order-item-name">${emojiImg(o.smoothie_emoji, o.smoothie_name)} ${o.smoothie_name} ${customBadge} <span class="order-size-tag">${sizeLabel}</span></div>
        ${ingredientRows ? `<div class="order-ingredients">${ingredientRows}</div>` : ''}
    </div>`;
}

/* ── Re-order an entire group ──────────────────────────────── */
async function reorderGroup(group, btn) {
    btn.disabled = true;
    btn.textContent = 'Поръчва се...';

    const batchId = group.length > 1
        ? Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        : null;

    let allOk = true;
    for (const o of group) {
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
                        liquid_id: liquid?.id,
                        ingredients: JSON.stringify(fruits.map(i => ({ id: i.id, grams: i.grams }))),
                        customer_name: null,
                    }),
                });
                // custom creates smoothie only; then place the order
                const customData = await res.json();
                if (!customData.success || !customData.smoothie_id) { allOk = false; break; }
                res = await fetch('/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ smoothie_id: customData.smoothie_id, size: o.size, customer_name: null, batch_id: batchId }),
                });
            } else {
                res = await fetch('/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ smoothie_id: o.smoothie_id, size: o.size, customer_name: null, batch_id: batchId }),
                });
            }
            const result = await res.json();
            if (!result.success) { allOk = false; break; }
        } catch(e) {
            console.error(e);
            allOk = false;
            break;
        }
    }

    if (allOk) {
        btn.textContent = 'Поръчано!';
        btn.style.background = '#059669';
        setTimeout(() => window.location.reload(), 1000);
    } else {
        btn.textContent = 'Грешка';
        btn.disabled = false;
    }
}
