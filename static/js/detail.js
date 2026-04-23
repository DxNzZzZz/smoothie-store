document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        document.getElementById('detail-hero').innerHTML = '<h2>Няма намерено смути</h2>';
        return;
    }

    try {
        const res = await fetch('/api/menu/' + id);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        
        const smoothie = data.smoothie;
        const fruits = data.fruits;
        
        document.title = smoothie.name + " — BlendBar";
        
        // Hero
        document.getElementById('detail-hero').innerHTML = `
          <div class="detail-emoji">${smoothie.emoji || '🥤'}</div>
          <h1>${smoothie.name}</h1>
          <p>${smoothie.description || ''}</p>
          <div class="detail-price">€${smoothie.price.toFixed(2)}</div>
        `;
        
        // Tags
        const tags = Array.isArray(smoothie.tags) ? smoothie.tags : (smoothie.tags ? smoothie.tags.split(',') : []);
        document.getElementById('detail-tags').innerHTML = tags.map(t => 
            `<span class="tag" style="font-size:.8rem; padding:.3rem .9rem;">${t.trim()}</span>`
        ).join('');
        
        // Macros
        document.getElementById('detail-macros').innerHTML = `
            <div class="macro">
              <div class="macro-value">${smoothie.total_calories || 0}</div>
              <div class="macro-label">Калории</div>
            </div>
            <div class="macro">
              <div class="macro-value">${smoothie.total_protein || 0}g</div>
              <div class="macro-label">Протеин</div>
            </div>
            <div class="macro">
              <div class="macro-value">${smoothie.total_carbs || 0}g</div>
              <div class="macro-label">Въглехидрати</div>
            </div>
            <div class="macro">
              <div class="macro-value">${smoothie.total_fat || 0}g</div>
              <div class="macro-label">Мазнини</div>
            </div>
            <div class="macro">
              <div class="macro-value">${smoothie.total_fiber || 0}g</div>
              <div class="macro-label">Фибри</div>
            </div>
        `;
        
        // Ingredients
        document.getElementById('detail-ingredients').innerHTML = fruits.map(f => `
            <div class="ingredient-card">
              <div class="ing-emoji">${f.emoji || '🌱'}</div>
              <div class="ing-name">${f.name}</div>
              <div class="ing-grams">${f.grams}g</div>
              <div style="margin-top:.7rem; display:grid; grid-template-columns:1fr 1fr; gap:.3rem;">
                <div class="macro" style="padding:.35rem;">
                  <div class="macro-value" style="font-size:.78rem;">${f.calories || 0}</div>
                  <div class="macro-label">ккал</div>
                </div>
                <div class="macro" style="padding:.35rem;">
                  <div class="macro-value" style="font-size:.78rem;">${f.protein_g || 0}g</div>
                  <div class="macro-label">прот</div>
                </div>
                <div class="macro" style="padding:.35rem;">
                  <div class="macro-value" style="font-size:.78rem;">${f.carbs_g || 0}g</div>
                  <div class="macro-label">въгл</div>
                </div>
                <div class="macro" style="padding:.35rem;">
                  <div class="macro-value" style="font-size:.78rem;">${f.fiber_g || 0}g</div>
                  <div class="macro-label">фибри</div>
                </div>
              </div>
            </div>
        `).join('');
        
    } catch(e) {
        console.error("Failed to fetch detail: ", e);
        document.getElementById('detail-hero').innerHTML = '<h2>Грешка при зареждане</h2>';
    }
});
