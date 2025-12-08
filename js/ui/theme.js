// Theme Management Module

export function initTheme() {
    updateTheme();

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-theme');
            if (isLight) {
                localStorage.setItem('themePreference', 'dark');
            } else {
                localStorage.setItem('themePreference', 'light');
            }
            updateTheme(true); // Pass true to indicate user-initiated change
        });
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            // Only auto-update if user hasn't set a preference
            if (!localStorage.getItem('themePreference')) {
                updateTheme();
            }
        });
    }
}

function updateTheme(animate = false) {
    // Add transition class for smooth animation
    if (animate) {
        document.body.classList.add('theme-transitioning');
    }

    const pref = localStorage.getItem('themePreference');
    if (pref === 'light') {
        document.body.classList.add('light-theme');
    } else if (pref === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        // Auto-detect from DevTools theme or System
        const theme = chrome.devtools.panels.themeName;
        if (theme === 'default') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
            }
        } else if (theme === 'dark') {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
    }
    
    updateThemeIcon();
    
    // Remove transition class after animation completes
    if (animate) {
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300); // Match CSS transition duration
    }
}

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z" fill="currentColor"/></svg>`;
        btn.title = "Switch to Dark Mode";
    } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" fill="currentColor" /></svg>`;
        btn.title = "Switch to Light Mode";
    }
}
