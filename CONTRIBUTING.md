# Contributing to rep+

Thank you for your interest in contributing! This guide will help you understand the codebase structure and how to add new features.

## Architecture Overview

The codebase is organized into clear, modular components:

```
js/
├── core/           # Core functionality (state, events, utilities)
├── features/       # Feature modules (each feature in its own folder)
├── network/        # Network operations (capture, sending, parsing)
├── ui/             # UI components (rendering, interactions)
└── search/         # Search functionality
```

## Adding a New Feature

### Step 1: Create Feature Folder

Create a new folder in `js/features/` for your feature:

```
js/features/your-feature/
├── index.js        # Main entry point (exports setup/init function)
└── ...             # Additional modules as needed
```

### Step 2: Follow the Pattern

Each feature should export an initialization function:

```javascript
// js/features/your-feature/index.js
export function setupYourFeature(elements) {
    // Initialize your feature here
    // elements object contains all DOM elements (from ui/main-ui.js)
    
    const yourButton = document.getElementById('your-button');
    if (yourButton) {
        yourButton.addEventListener('click', () => {
            // Your feature logic
        });
    }
}
```

### Step 3: Register in main.js

Add your feature to `js/main.js`:

```javascript
// Import your feature
import { setupYourFeature } from './features/your-feature/index.js';

// Initialize it (in DOMContentLoaded)
setupYourFeature(elements);
```

### Step 4: Use Core Utilities

- **State Management**: Import from `core/state.js`
  ```javascript
  import { state, addRequest } from '../core/state.js';
  ```

- **Events**: Use the event bus for decoupled communication
  ```javascript
  import { events, EVENT_NAMES } from '../core/events.js';
  events.emit(EVENT_NAMES.REQUEST_SELECTED, index);
  ```

- **Utilities**: Import from specific utility modules
  ```javascript
  import { formatBytes } from '../core/utils/format.js';
  import { escapeHtml } from '../core/utils/dom.js';
  import { getHostname } from '../core/utils/network.js';
  ```

## Example: Adding a "Export to HAR" Feature

1. **Create the feature folder**:
   ```
   js/features/export-har/
   └── index.js
   ```

2. **Implement the feature**:
   ```javascript
   // js/features/export-har/index.js
   import { state } from '../../core/state.js';
   
   export function setupExportHAR() {
       const exportBtn = document.getElementById('export-har-btn');
       if (exportBtn) {
           exportBtn.addEventListener('click', () => {
               const har = generateHAR(state.requests);
               downloadFile(har, 'requests.har');
           });
       }
   }
   ```

3. **Register in main.js**:
   ```javascript
   import { setupExportHAR } from './features/export-har/index.js';
   // ... in DOMContentLoaded
   setupExportHAR();
   ```

## Best Practices

1. **Keep features modular**: Each feature should be self-contained
2. **Use events for communication**: Avoid direct dependencies between features
3. **Follow naming conventions**: Use descriptive, consistent names
4. **Import from specific modules**: Don't create circular dependencies
5. **Update UI via events**: Emit events instead of directly manipulating DOM from other modules

## Using AI/LLM Assistance

AI can speed you up, but you’re responsible for the code you submit. Please:

1. **Understand the code**: Don’t paste blindly. Read and reason about every change.
2. **Keep diffs small**: Ask the LLM for focused snippets, not large rewrites.
3. **Check security & privacy**: No secrets in code; be mindful of optional permissions, data flow, and user prompts.
4. **Validate logic & side effects**: Ensure event wiring, state updates, and DOM changes make sense; avoid regressions.
5. **Respect licenses**: Don’t include code with incompatible licenses.
6. **Test what you touch**: Run or manually verify the affected paths when possible.

## Module Responsibilities

- **`core/state.js`**: Global application state
- **`core/events.js`**: Event bus for module communication
- **`core/utils/`**: Utility functions (format, dom, network, misc)
- **`ui/main-ui.js`**: DOM element references and UI orchestration
- **`network/`**: Request/response handling
- **`features/`**: Feature implementations

## Need Help?

- Check existing features for examples (`features/ai/`, `features/bulk-replay/`)
- Review how events are used in `ui/request-list.js` and `ui/request-editor.js`
- Look at `main.js` to see how features are initialized

Happy contributing! 🚀

