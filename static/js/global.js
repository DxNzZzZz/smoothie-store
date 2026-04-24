async function loadComponent(id, url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const text = await response.text();
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = text;
            }
        }
    } catch (e) {
        console.error("Error loading component: ", e);
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        const user = await response.json();
        
        // Find navbar elements after component has loaded
        const navRight = document.getElementById('nav-right');
        if (!navRight) return;

        if (user) {
            navRight.innerHTML = `
                <a href="/profile" class="nav-link">Профил</a>
                <a href="/api/user_logout" class="nav-link">Изход</a>
            `;
        } else {
            navRight.innerHTML = `
                <a href="/user_login" class="nav-link">Вход</a>
                <a href="/register" class="nav-link">Регистрация</a>
            `;
        }
    } catch (e) {
        console.error("Error checking auth: ", e);
    }
}

// Load shared components and initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load navbar and footer first
    await loadComponent('navbar', '/components/nav.html');
    await loadComponent('footer', '/components/footer.html');
    
    // Auth-dependent UI
    checkAuth();
});
