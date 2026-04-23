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
        } else {
            let trs = '';
            for (const o of orders) {
                let s_size = o.size;
                if (s_size === 'small') s_size = 'Малка';
                else if (s_size === 'medium') s_size = 'Средна';
                else if (s_size === 'large') s_size = 'Голяма';
                
                let s_status = '';
                if (o.status === 'pending') {
                    s_status = '<span style="background: #fdf6b2; color: #c27803; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">В Изчакване</span>';
                } else {
                    s_status = '<span style="background: #def7ec; color: #03543f; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">Завършена</span>';
                }
                
                let c_mark = o.is_custom ? '<span style="font-size: 0.8rem; background: var(--secondary); color:#fff; padding: 2px 6px; border-radius:12px; margin-left: 5px;">Персонализирано</span>' : '';
                
                trs += `
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 15px; color: #666; font-size: 0.9rem;">${o.created_at}</td>
                    <td style="padding: 15px; font-weight: bold;">${o.smoothie_name} ${c_mark}</td>
                    <td style="padding: 15px; text-transform: capitalize;">${s_size}</td>
                    <td style="padding: 15px;">${s_status}</td>
                  </tr>
                `;
            }
            
            ordersContainer.innerHTML = `
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                  <thead style="background-color: #f9fafb;">
                    <tr>
                      <th style="padding: 15px; border-bottom: 2px solid #eaeaea;">Час</th>
                      <th style="padding: 15px; border-bottom: 2px solid #eaeaea;">Смути</th>
                      <th style="padding: 15px; border-bottom: 2px solid #eaeaea;">Размер</th>
                      <th style="padding: 15px; border-bottom: 2px solid #eaeaea;">Статус</th>
                    </tr>
                  </thead>
                  <tbody>${trs}</tbody>
                </table>
              </div>
            `;
        }
    } catch(e) {
        console.error("Profile load failed", e);
        document.getElementById('user-info').innerHTML = 'Грешка при зареждане';
    }
});
