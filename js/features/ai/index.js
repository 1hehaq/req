// AI Integration Module - Main entry point and UI setup
import { getAISettings, saveAISettings, streamExplanationWithSystem } from './core.js';
import { handleAIExplanation } from './explain.js';
import { handleAttackSurfaceAnalysis } from './suggestions.js';

// Re-export core functions for backward compatibility
export { 
    getAISettings, 
    saveAISettings, 
    streamExplanation, 
    streamExplanationWithSystem,
    streamExplanationFromClaude,
    streamExplanationFromClaudeWithSystem,
    streamExplanationFromGemini,
    streamExplanationFromGeminiWithSystem
} from './core.js';
export { handleAIExplanation } from './explain.js';
export { handleAttackSurfaceAnalysis } from './suggestions.js';

export function setupAIFeatures(elements) {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const aiProviderSelect = document.getElementById('ai-provider');
    const anthropicApiKeyInput = document.getElementById('anthropic-api-key');
    const anthropicModelSelect = document.getElementById('anthropic-model');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const geminiModelSelect = document.getElementById('gemini-model');
    const anthropicSettings = document.getElementById('anthropic-settings');
    const geminiSettings = document.getElementById('gemini-settings');
    const aiMenuBtn = document.getElementById('ai-menu-btn');
    const aiMenuDropdown = document.getElementById('ai-menu-dropdown');
    const explainBtn = document.getElementById('explain-btn');
    const suggestAttackBtn = document.getElementById('suggest-attack-btn');
    const explanationModal = document.getElementById('explanation-modal');
    const explanationContent = document.getElementById('explanation-content');
    const ctxExplainAi = document.getElementById('ctx-explain-ai');

    // Handle provider switching
    if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', () => {
            const provider = aiProviderSelect.value;
            if (provider === 'gemini') {
                anthropicSettings.style.display = 'none';
                geminiSettings.style.display = 'block';
            } else {
                anthropicSettings.style.display = 'block';
                geminiSettings.style.display = 'none';
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const { provider, apiKey, model } = getAISettings();

            if (aiProviderSelect) aiProviderSelect.value = provider;

            if (provider === 'gemini') {
                geminiApiKeyInput.value = apiKey;
                if (geminiModelSelect) geminiModelSelect.value = model;
                anthropicSettings.style.display = 'none';
                geminiSettings.style.display = 'block';
            } else {
                anthropicApiKeyInput.value = apiKey;
                if (anthropicModelSelect) anthropicModelSelect.value = model;
                anthropicSettings.style.display = 'block';
                geminiSettings.style.display = 'none';
            }

            settingsModal.style.display = 'block';
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const provider = aiProviderSelect ? aiProviderSelect.value : 'anthropic';
            let key, model;

            if (provider === 'gemini') {
                key = geminiApiKeyInput.value.trim();
                model = geminiModelSelect ? geminiModelSelect.value : 'gemini-flash-latest';
            } else {
                key = anthropicApiKeyInput.value.trim();
                model = anthropicModelSelect ? anthropicModelSelect.value : 'claude-3-5-sonnet-20241022';
            }

            if (key) {
                saveAISettings(provider, key, model);
            }

            alert('Settings saved!');
            settingsModal.style.display = 'none';
        });
    }

    if (aiMenuBtn && aiMenuDropdown) {
        aiMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            aiMenuDropdown.classList.toggle('show');
        });
        window.addEventListener('click', () => {
            if (aiMenuDropdown.classList.contains('show')) {
                aiMenuDropdown.classList.remove('show');
            }
        });
    }

    if (explainBtn) {
        explainBtn.addEventListener('click', () => {
            const content = elements.rawRequestInput.innerText;
            if (!content.trim()) {
                alert('Request is empty.');
                return;
            }
            handleAIExplanation("Explain this HTTP request:", content, explanationModal, explanationContent, settingsModal);
        });
    }

    if (suggestAttackBtn) {
        suggestAttackBtn.addEventListener('click', async () => {
            const requestContent = elements.rawRequestInput.innerText;
            if (!requestContent.trim()) {
                alert('Request is empty.');
                return;
            }

            // Get response content
            let responseContent = elements.rawResponseDisplay.innerText || '';
            
            // Import handleSendRequest dynamically to avoid circular dependency
            let handleSendRequest = null;
            try {
                const handlerModule = await import('../../network/handler.js');
                handleSendRequest = handlerModule.handleSendRequest;
            } catch (error) {
                console.warn('Could not import handleSendRequest:', error);
            }

            await handleAttackSurfaceAnalysis(
                requestContent,
                responseContent,
                explanationModal,
                explanationContent,
                settingsModal,
                handleSendRequest
            );
        });
    }

    if (ctxExplainAi) {
        ctxExplainAi.addEventListener('click', () => {
            // Hide context menu if open
            const contextMenu = document.getElementById('context-menu');
            if (contextMenu) {
                contextMenu.classList.remove('show');
                contextMenu.style.visibility = 'hidden';
            }

            // Get stored selected text from context menu dataset
            const selectedText = contextMenu?.dataset.selectedText || window.getSelection().toString().trim();
            if (!selectedText) {
                alert('Please select some text to explain.');
                return;
            }
            const prompt = `Explain this specific part of an HTTP request / response: \n\n"${selectedText}"\n\nProvide context on what it is, how it's used, and any security relevance.`;
            handleAIExplanation(prompt, "", explanationModal, explanationContent, settingsModal);
            
            // Clear stored text
            if (contextMenu) {
                delete contextMenu.dataset.selectedText;
            }
        });
    }

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}
