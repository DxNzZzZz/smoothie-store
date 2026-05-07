const SIZE_FACTORS = { small: 0.75, medium: 1.0, large: 1.3 };
const CART_KEY = 'blendbar_cart';

let smoothies = [];
let cart = []; // [{ smoothie, size }]

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(
        cart.map(item => ({ smoothie_id: item.smoothie.id, size: item.size }))
    ));
}

async function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        for (const entry of saved) {
            let s = smoothies.find(x => x.id == entry.smoothie_id);
            if (!s) {
                // Might be a custom smoothie — fetch it directly
                try {
                    const r = await fetch('/api/menu/' + entry.smoothie_id);
                    if (r.ok) {
                        const d = await r.json();
                        s = d.smoothie;
                        smoothies.push(s);
                    }
                } catch(e) { /* skip if unreachable */ }
            }
            if (s) cart.push({ smoothie: s, size: entry.size });
        }
    } catch(e) { /* ignore corrupt data */ }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Auth check — hide name field if logged in
    try {
        const authRes = await fetch('/api/auth/me');
        const user = await authRes.json();
        if (user) {
            const nameGroup = document.getElementById('customer-name-group');
            if (nameGroup) nameGroup.style.display = 'none';
        }
    } catch(e) { /* guest */ }

    // Load menu
    try {
        const res = await fetch('/api/menu');
        smoothies = await res.json();
        renderCatalog();
    } catch(e) {
        console.error("Failed to fetch menu:", e);
    }

    // Always restore saved cart first
    await loadCart();

    // Pre-add smoothie if ?id= is in the URL (supports custom smoothies too)
    const preId = new URLSearchParams(window.location.search).get('id');
    if (preId) {
        let pre = smoothies.find(s => s.id == preId);
        if (!pre) {
            // Could be a custom smoothie not in the menu list — fetch it directly
            try {
                const r = await fetch('/api/menu/' + preId);
                if (r.ok) {
                    const d = await r.json();
                    pre = d.smoothie;
                    smoothies.push(pre);
                }
            } catch(e) { console.error("Failed to fetch custom smoothie:", e); }
        }
        if (pre) {
            const alreadyIn = cart.some(c => c.smoothie.id == pre.id);
            if (!alreadyIn) addToCart(pre.id); // addToCart calls saveCart + renderCart
            else renderCart();
            history.replaceState(null, '', '/order');
        } else {
            renderCart();
        }
    } else {
        renderCart();
    }

    // Success message from URL
    if (new URLSearchParams(window.location.search).get('success') === 'true') {
        showFlash('success', 'Поръчката е приета успешно!');
    }

    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
});

/* ── Catalog ─────────────────────────────────────────── */

function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    for (const s of smoothies) {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.innerHTML = `
          <div class="catalog-card-header">
            <div class="card-name">${emojiImg(s.emoji, s.name)} ${s.name}</div>
            <div class="card-price">€${s.price.toFixed(2)}</div>
          </div>
          <div class="catalog-card-body">
            <p class="card-desc">${s.description || ''}</p>
            <div class="macros">
              <div class="macro">
                <div class="macro-value">${s.total_calories}</div>
                <div class="macro-label">ккал</div>
              </div>
              <div class="macro">
                <div class="macro-value">${s.total_protein}г</div>
                <div class="macro-label">протеин</div>
              </div>
              <div class="macro">
                <div class="macro-value">${s.total_carbs}г</div>
                <div class="macro-label">въгл</div>
              </div>
              <div class="macro">
                <div class="macro-value">${s.total_fat}г</div>
                <div class="macro-label">маз</div>
              </div>
              <div class="macro">
                <div class="macro-value">${s.total_fiber}г</div>
                <div class="macro-label">фибри</div>
              </div>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${s.id})">
              + Добави в количка
            </button>
          </div>
        `;
        grid.appendChild(card);
    }
}

/* ── Cart logic ──────────────────────────────────────── */

function addToCart(smoothieId) {
    const s = smoothies.find(x => x.id == smoothieId);
    if (!s) return;
    cart.push({ smoothie: s, size: 'medium' });
    saveCart();
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function updateSize(index, size) {
    cart[index].size = size;
    saveCart();
    renderCart();
}

function renderCart() {
    const empty = cart.length === 0;

    document.getElementById('cart-empty').style.display = empty ? 'block' : 'none';
    document.getElementById('cart-items').style.display = empty ? 'none' : 'block';

    const badge = document.getElementById('cart-count');
    badge.textContent = cart.length;
    badge.style.display = empty ? 'none' : 'inline';

    if (empty) return;

    const list = document.getElementById('cart-list');
    list.innerHTML = '';

    let totalCalories = 0;
    let totalProtein  = 0;
    let totalPrice    = 0;

    for (let i = 0; i < cart.length; i++) {
        const { smoothie: s, size } = cart[i];
        const f = SIZE_FACTORS[size];

        const cal     = Math.round(s.total_calories * f);
        const protein = (s.total_protein * f).toFixed(1);
        const carbs   = (s.total_carbs * f).toFixed(1);
        const fat     = (s.total_fat * f).toFixed(1);
        const fiber   = (s.total_fiber * f).toFixed(1);
        const price   = s.price * f;

        totalCalories += cal;
        totalProtein  += s.total_protein * f;
        totalPrice    += price;

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
          <div class="cart-item-header">
            <span class="cart-item-name">${emojiImg(s.emoji, s.name)} ${s.name}</span>
            <button class="cart-item-remove" onclick="removeFromCart(${i})" title="Премахни">✕</button>
          </div>
          <select class="cart-item-size-select" onchange="updateSize(${i}, this.value)">
            <option value="small"  ${size === 'small'  ? 'selected' : ''}>Малка (×0.75)</option>
            <option value="medium" ${size === 'medium' ? 'selected' : ''}>Средна (×1.0)</option>
            <option value="large"  ${size === 'large'  ? 'selected' : ''}>Голяма (×1.3)</option>
          </select>
          <div class="macros" style="margin-top:.6rem; margin-bottom:.5rem;">
            <div class="macro"><div class="macro-value">${cal}</div><div class="macro-label">ккал</div></div>
            <div class="macro"><div class="macro-value">${protein}г</div><div class="macro-label">протеин</div></div>
            <div class="macro"><div class="macro-value">${carbs}г</div><div class="macro-label">въгл</div></div>
            <div class="macro"><div class="macro-value">${fat}г</div><div class="macro-label">маз</div></div>
            <div class="macro"><div class="macro-value">${fiber}г</div><div class="macro-label">фибри</div></div>
          </div>
          <div class="cart-item-price">€${price.toFixed(2)}</div>
        `;
        list.appendChild(item);
    }

    document.getElementById('total-calories').textContent = `${totalCalories} ккал`;
    document.getElementById('total-protein').textContent  = `${totalProtein.toFixed(1)}г`;
    document.getElementById('total-price').textContent    = `€${totalPrice.toFixed(2)}`;
}

/* ── Place order ─────────────────────────────────────── */

async function placeOrder() {
    if (cart.length === 0) return;

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Изпращане...';

    const customerName = document.getElementById('customer_name')?.value || null;
    const snapshot = [...cart];
    const batchId = snapshot.length > 1
        ? Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        : null;
    let allSuccess = true;

    for (const item of snapshot) {
        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerName,
                    smoothie_id: item.smoothie.id,
                    size: item.size,
                    batch_id: batchId,
                })
            });
            const data = await res.json();
            if (!data.success) {
                allSuccess = false;
                showFlash('error', data.message || 'Възникна грешка');
                break;
            }
        } catch(e) {
            allSuccess = false;
            showFlash('error', 'Мрежова грешка. Моля, опитайте отново.');
            break;
        }
    }

    if (allSuccess) {
        const count = snapshot.length;
        cart = [];
        saveCart();
        renderCart();
        showFlash('success', `Поръчката е приета! ${count} ${count === 1 ? 'смути' : 'смутита'} ще бъдат готови след ~5 минути.`);
    }

    btn.disabled = false;
    btn.textContent = 'Поръчай';
}

/* ── Flash ───────────────────────────────────────────── */

function showFlash(type, message) {
    const flash = document.getElementById('flash-message');
    flash.style.display = 'block';
    flash.className = `flash flash-${type}`;
    flash.textContent = message;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { flash.style.display = 'none'; }, 6000);
}
