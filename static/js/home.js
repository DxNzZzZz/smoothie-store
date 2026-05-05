document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/featured');
        const smoothies = await res.json();
        
        const grid = document.getElementById('featured-grid');
        grid.innerHTML = '';
        
        for (const s of smoothies) {
            const tags = Array.isArray(s.tags) ? s.tags : (s.tags ? s.tags.split(',') : []);
            const tagsHtml = tags.map(t => `<span class="tag">${t.trim()}</span>`).join('');
            
            const card = document.createElement('a');
            card.href = '/detail?id=' + s.id;
            card.className = 'smoothie-card';
            card.innerHTML = `
              <div class="card-header">
                <div>
                  <div class="card-name">${emojiImg(s.emoji, s.name)} ${s.name}</div>
                  <div class="card-price">€${s.price.toFixed(2)}</div>
                </div>
              </div>
              <div class="card-body">
                <p class="card-desc">${s.description || ''}</p>
                <div class="macros">
                  <div class="macro">
                    <div class="macro-value">${s.total_calories || 0}</div>
                    <div class="macro-label">ккал</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_protein || 0}г</div>
                    <div class="macro-label">протеин</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_carbs || 0}г</div>
                    <div class="macro-label">въглехидрати</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_fat || 0}г</div>
                    <div class="macro-label">мазнини</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_fiber || 0}г</div>
                    <div class="macro-label">фибри</div>
                  </div>
                </div>
                <div class="tags">${tagsHtml}</div>
              </div>
            `;
            grid.appendChild(card);
        }
    } catch(e) {
        console.error("Failed to fetch featured smoothies: ", e);
    }
});
