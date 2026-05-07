let db = {};
let fruitSelection = {};
window.db = db;

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    try {
        const authRes = await fetch('/api/auth/me');
        const user = await authRes.json();
        if (user) {
            document.getElementById('customer-name-group').style.display = 'none';
            document.getElementById('customer_name').removeAttribute('required');
        }
    } catch(e) { console.error("Auth check failed", e); }

    // Fetch builder data
    try {
        const res = await fetch('/api/custom');
        const data = await res.json();
        
        const fruits = data.fruits;
        const liquids = data.liquids;
        
        for (const i of fruits) {
            db[i.id] = { id: i.id, name: i.name, emoji: i.emoji, cal: i.calories, p: i.protein_g, c: i.carbs_g, f: i.fat_g, flex: i.fiber_g, price: i.price_per_100g, liquid: false };
        }
        for (const i of liquids) {
            db[i.id] = { id: i.id, name: i.name, emoji: i.emoji, cal: i.calories, p: i.protein_g, c: i.carbs_g, f: i.fat_g, flex: i.fiber_g, price: i.price_per_100g, liquid: true };
        }
        
        // Render Liquids
        const liqContainer = document.getElementById('liquids-container');
        liqContainer.innerHTML = liquids.map((l, idx) => `
            <label class="liquid-option" data-id="${l.id}">
              <input type="radio" name="liquid_id" value="${l.id}" required ${idx === 0 ? 'checked' : ''}>
              <div style="display: flex; flex-direction: column;">
                <span>${emojiImg(l.emoji, l.name)} ${l.name}</span>
                <small style="color: #888; font-size: 0.75rem;">${l.calories || 0} ккал | ${l.protein_g || 0}п | ${l.carbs_g || 0}в | ${l.fat_g || 0}м (на 100g)</small>
              </div>
            </label>
        `).join('');
        
        // Render Fruits
        const fruitContainer = document.getElementById('fruits-container');
        fruitContainer.innerHTML = fruits.map(f => `
            <div class="fruit-option" data-id="${f.id}">
              <div class="fruit-option-header">
                <span class="fruit-option-emoji">${emojiImg(f.emoji, f.name)}</span>
                <div class="fruit-option-info">
                  <div class="fruit-option-name-row">
                    <span class="fruit-option-name">${f.name}</span>
                    <div class="macro-tooltip-wrapper">
                      <button class="macro-info-btn" type="button" tabindex="-1" aria-label="Макро информация">ℹ</button>
                      <div class="macro-popup">
                        <div class="mp-row"><span class="mp-label">Протеин</span><span class="mp-val">${(f.protein_g||0).toFixed(1)}g</span></div>
                        <div class="mp-row"><span class="mp-label">Въглехидрати</span><span class="mp-val">${(f.carbs_g||0).toFixed(1)}g</span></div>
                        <div class="mp-row"><span class="mp-label">Мазнини</span><span class="mp-val">${(f.fat_g||0).toFixed(1)}g</span></div>
                        <div class="mp-row"><span class="mp-label">Фибри</span><span class="mp-val">${(f.fiber_g||0).toFixed(1)}g</span></div>
                        <div style="opacity:.55; font-size:0.68rem; margin-top:3px; text-align:center;">на 100g</div>
                      </div>
                    </div>
                  </div>
                  <span class="fruit-option-meta">€${f.price_per_100g.toFixed(2)}/100g · ${f.calories || 0} ккал</span>
                </div>
              </div>
              <div class="fruit-slider-row">
                <input type="range" class="fruit-slider" id="slider-${f.id}" min="0" max="600" step="10" value="0" oninput="updateFruitFromSlider(${f.id})">
                <span class="qty-val" id="qty-val-${f.id}">0g</span>
              </div>
            </div>
        `).join('');

        document.getElementById('submit-btn').disabled = false;
        
        setupListeners();
        onSizeChange();

    } catch(e) {
        console.error("Failed to load builder", e);
    }
    
    // Form submit
    document.getElementById('custom-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        
        const payload = {
            customer_name: document.getElementById('customer_name').value || null,
            size: document.getElementById('size-select').value,
            liquid_id: parseInt(document.querySelector('input[name="liquid_id"]:checked').value),
            ingredients: document.getElementById('form-ingredients-json').value
        };
        
        try {
            const res = await fetch('/api/custom', {
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
                // scroll to top
                window.scrollTo(0,0);
                setTimeout(() => window.location.href = '/profile.html?success=true', 1500);
            } else {
                flash.className = 'flash flash-error';
                flash.textContent = data.message || 'Error occurred';
            }
        } catch(err) {
            console.error(err);
        }
        btn.disabled = false;
    });
});

const maxDisplay = () => document.getElementById('fruit-max-display');
const currDisplay = () => document.getElementById('fruit-current-display');
const sizeSelect = () => document.getElementById('size-select');

function setupListeners() {
    sizeSelect().addEventListener('change', onSizeChange);
    document.getElementById('sort-select').addEventListener('change', sortIngredients);
    const radios = document.querySelectorAll('input[name="liquid_id"]');
    radios.forEach(r => r.addEventListener('change', recalc));
}

function recalc() {
    const opt = sizeSelect().options[sizeSelect().selectedIndex];
    const totalGoalGrams = parseFloat(opt.dataset.total);
    const maxFruitGrams = parseFloat(opt.dataset.fruit);
    
    let currentFruitGrams = 0;
    for (const [id, g] of Object.entries(fruitSelection)) {
      currentFruitGrams += g;
    }
    
    const liquidGrams = totalGoalGrams - currentFruitGrams;
    const liquidChecked = document.querySelector('input[name="liquid_id"]:checked');
    const liquidId = liquidChecked ? liquidChecked.value : null;

    maxDisplay().textContent = maxFruitGrams;
    currDisplay().textContent = currentFruitGrams;

    const warning = document.getElementById('fruit-limit-warning');
    const warningText = document.getElementById('fruit-limit-warning-text');
    if (currentFruitGrams >= maxFruitGrams) {
      currDisplay().style.color = '#c0392b';
      currDisplay().style.fontWeight = 'bold';
      warningText.textContent =
        `Достигнахте максималния лимит от ${maxFruitGrams}g плодове за този размер. ` +
        `За да добавите повече, изберете по-голям размер.`;
      warning.classList.add('visible');
    } else {
      currDisplay().style.color = '#666';
      currDisplay().style.fontWeight = 'normal';
      warning.classList.remove('visible');
    }

    let tCal = 0, tP = 0, tC = 0, tF = 0, tPrice = 0;
    
    let allItemGrams = { ...fruitSelection };
    if (liquidId) allItemGrams[liquidId] = liquidGrams;

    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = '';

    const payload = [];

    for (const [idStr, grams] of Object.entries(allItemGrams)) {
      if (grams <= 0) continue;
      const gFloat = parseFloat(grams);
      const id = parseInt(idStr);
      const item = db[id];
      if (!item) continue;
      
      const ratio = gFloat / 100.0;
      tCal += (item.cal || 0) * ratio;
      tP += (item.p || 0) * ratio;
      tC += (item.c || 0) * ratio;
      tF += (item.f || 0) * ratio;
      tPrice += (item.price || 0) * ratio;

      if (!item.liquid) { payload.push({ id, grams: gFloat }); }

      const li = document.createElement('li');
      li.style.marginBottom = '0.5rem';
      li.innerHTML = `<span>${emojiImg(item.emoji, item.name)} ${item.name}</span> <span style="float:right; font-weight:bold;">${gFloat}g</span>`;
      summaryList.appendChild(li);
    }
    
    tPrice = tPrice * 1.1;

    document.getElementById('total-kcal').textContent = Math.round(tCal) + ' ккал';
    document.getElementById('total-pro').textContent = tP.toFixed(1) + 'g';
    document.getElementById('total-car').textContent = tC.toFixed(1) + 'g';
    document.getElementById('total-fat').textContent = tF.toFixed(1) + 'g';
    document.getElementById('total-price').textContent = '€' + tPrice.toFixed(2);

    document.getElementById('form-ingredients-json').value = JSON.stringify(payload);
}

function onSizeChange() {
    const opt = sizeSelect().options[sizeSelect().selectedIndex];
    const maxFruitGrams = parseFloat(opt.dataset.fruit);
    
    const sliders = document.querySelectorAll('.fruit-slider');
    sliders.forEach(s => s.max = maxFruitGrams);

    let currentTotal = 0;
    for (const g of Object.values(fruitSelection)) {
      currentTotal += g;
    }
    
    if (currentTotal > maxFruitGrams) {
      for (let key in fruitSelection) {
        fruitSelection[key] = 0;
        const slider = document.getElementById('slider-' + key);
        if(slider) slider.value = 0;
        const valDisp = document.getElementById('qty-val-' + key);
        if(valDisp) valDisp.textContent = '0g';
      }
    }
    recalc();
}

window.updateFruitFromSlider = function(id) {
    const slider = document.getElementById('slider-' + id);
    const newValue = parseInt(slider.value) || 0;
    
    const opt = sizeSelect().options[sizeSelect().selectedIndex];
    const maxFruitGrams = parseFloat(opt.dataset.fruit);
    
    let currentOtherTotal = 0;
    for (const [key, g] of Object.entries(fruitSelection)) {
      if (parseInt(key) !== id) {
        currentOtherTotal += g;
      }
    }
    
    if (currentOtherTotal + newValue > maxFruitGrams) {
      const allowed = maxFruitGrams - currentOtherTotal;
      slider.value = allowed;
      fruitSelection[id] = allowed;
    } else {
      fruitSelection[id] = newValue;
    }
    
    document.getElementById('qty-val-' + id).textContent = fruitSelection[id] + 'g';
    // highlight card when it has a non-zero value
    const card = document.querySelector(`.fruit-option[data-id="${id}"]`);
    if (card) card.classList.toggle('active', fruitSelection[id] > 0);
    recalc();
}

function sortIngredients() {
    const sortBy = document.getElementById('sort-select').value;
    
    const liqContainer = document.getElementById('liquids-container');
    const liquids = Array.from(liqContainer.querySelectorAll('.liquid-option'));
    liquids.sort((a, b) => compareItems(a, b, sortBy));
    liquids.forEach(el => liqContainer.appendChild(el));
    
    const fruitContainer = document.getElementById('fruits-container');
    const fruits = Array.from(fruitContainer.querySelectorAll('.fruit-option'));
    fruits.sort((a, b) => compareItems(a, b, sortBy));
    fruits.forEach(el => fruitContainer.appendChild(el));
}

function compareItems(nodeA, nodeB, criteria) {
    const idA = nodeA.dataset.id;
    const idB = nodeB.dataset.id;
    const itemA = db[idA];
    const itemB = db[idB];
    if (!itemA || !itemB) return 0;

    if (criteria === 'name') {
        // Alphabetical A → Z
        return itemA.name.localeCompare(itemB.name);
    }

    // All nutritional sorts: highest value first (descending)
    const keyMap = { cal: 'cal', p: 'p', c: 'c', f: 'f' };
    const key = keyMap[criteria];
    if (key) {
        const aVal = parseFloat(itemA[key]) || 0;
        const bVal = parseFloat(itemB[key]) || 0;
        return bVal - aVal;   // descending — biggest first
    }

    return 0;
}
