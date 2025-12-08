// DOM manipulation utilities

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export async function copyToClipboard(text, btn) {
    try {
        // Try modern API first
        await navigator.clipboard.writeText(text);
        showCopySuccess(btn);
    } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);

        // Fallback: create temporary textarea
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;

            // Ensure it's not visible but part of DOM
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showCopySuccess(btn);
            } else {
                throw new Error('execCommand copy failed');
            }
        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            // Show error state on button
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f28b82"/></svg>';
            setTimeout(() => {
                btn.innerHTML = originalHtml;
            }, 1500);
        }
    }
}

function showCopySuccess(btn) {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#81c995"/></svg>';

    setTimeout(() => {
        btn.innerHTML = originalHtml;
    }, 1500);
}

