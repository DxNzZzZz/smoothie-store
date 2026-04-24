document.addEventListener('DOMContentLoaded', async () => {
    // Determine if user is logged in to hide name field
    try {
        const authRes = await fetch('/api/auth/me');
        const user = await authRes.json();
        if (user) {
            document.getElementById('customer-name-group').style.display = 'none';
            document.getElementById('customer_name').removeAttribute('required');
        }
    } catch(e) {
        console.error("Auth check failed", e);
    }

    // Load setup data
    try {
        const res = await fetch('/api/menu');
        const smoothies = await res.json();
        
        const select = document.getElementById('smoothie_id');
        for (const s of smoothies) {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.emoji || '🥤'} ${s.name} — €${s.price.toFixed(2)} (${s.total_calories || 0} ккал)`;
            select.appendChild(option);
        }

        // Pre-select smoothie if ?id= is in the URL
        const preId = new URLSearchParams(window.location.search).get('id');
        if (preId) select.value = preId;

    } catch(e) {
        console.error("Failed to fetch menu: ", e);
    }

    // Check URL parameters for pre-selected or messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        const flash = document.getElementById('flash-message');
        flash.style.display = 'block';
        flash.className = 'flash flash-success';
        flash.textContent = 'Поръчката е приета успешно!';
    }
    
    // Process form
    const form = document.getElementById('order-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.getElementById('submit-btn').disabled = true;
        
        const payload = {
            customer_name: document.getElementById('customer_name').value || null,
            smoothie_id: parseInt(document.getElementById('smoothie_id').value),
            size: document.getElementById('size').value
        };
        
        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            const flash = document.getElementById('flash-message');
            flash.style.display = 'block';
            if (data.success) {
                flash.className = 'flash flash-success';
                flash.textContent = data.message;
                form.reset();
            } else {
                flash.className = 'flash flash-error';
                flash.textContent = data.message || 'Възникна грешка';
            }
        } catch(e) {
            const flash = document.getElementById('flash-message');
            flash.style.display = 'block';
            flash.className = 'flash flash-error';
            flash.textContent = 'Network Error';
        }
        
        document.getElementById('submit-btn').disabled = false;
    });
});
