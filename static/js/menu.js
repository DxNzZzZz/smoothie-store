document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/menu');
        const smoothies = await res.json();
        
        const grid = document.getElementById('menu-grid');
        grid.innerHTML = '';
        
        for (const s of smoothies) {
            const tags = Array.isArray(s.tags) ? s.tags : (s.tags ? s.tags.split(',') : []);
            const tagsHtml = tags.map(t => `<span class="tag">${t.trim()}</span>`).join('');
            
            const card = document.createElement('a');
            card.href = '/detail.html?id=' + s.id;
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
                    <div class="macro-value">${s.total_protein || 0}g</div>
                    <div class="macro-label">протеин</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_carbs || 0}g</div>
                    <div class="macro-label">въглехидрати</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_fat || 0}g</div>
                    <div class="macro-label">мазнини</div>
                  </div>
                  <div class="macro">
                    <div class="macro-value">${s.total_fiber || 0}g</div>
                    <div class="macro-label">фибри</div>
                  </div>
                </div>
                <div class="tags">${tagsHtml}</div>
              </div>
            `;
            grid.appendChild(card);
        }
        // "Build your own" CTA card — always last
        const ctaCard = document.createElement('a');
        ctaCard.href = '/custom';
        ctaCard.className = 'smoothie-card custom-cta-card';
        ctaCard.innerHTML = `
          <div class="card-header custom-cta-header">
            <div>
              <div class="card-name">Направи свое смути</div>
              <div class="card-price">Ти избираш всичко</div>
            </div>
          </div>
          <div class="card-body custom-cta-body">
            <p class="card-desc">Избери плодове, течност и размер — ние го правим. Цената се изчислява автоматично.</p>
            <div class="custom-cta-btn">Създай сега →</div>
          </div>
        `;
        grid.appendChild(ctaCard);

    } catch(e) {
        console.error("Failed to fetch menu: ", e);
    }
});
