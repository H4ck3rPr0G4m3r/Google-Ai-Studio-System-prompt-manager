console.log("AI Studio Prompter content script loaded.");

// Register with the background script to indicate this content script is active
chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_LOADED" }, (response) => {
    if (chrome.runtime.lastError) {
        console.error("Failed to register content script:", chrome.runtime.lastError);
    } else {
        console.log("Content script registered with background script");
    }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);

    if (message.type === "INJECT_PROMPT" && message.text) {
        // Attempt to inject both the prompt text and adjust temperature if provided
        Promise.all([
            injectPromptText(message.text),
            message.temperature !== undefined ? adjustTemperature(message.temperature) : Promise.resolve(null)
        ])
        .then(([targetElement, temperatureElement]) => {
            console.log("Prompt injected successfully into:", targetElement);
            if (temperatureElement) {
                console.log("Temperature adjusted successfully:", temperatureElement);
            }
            sendResponse({ 
                status: "success",
                temperatureAdjusted: !!temperatureElement
            });
        })
        .catch(error => {
            console.error("Injection failed:", error);
            sendResponse({ status: "error", message: error.message });
        });
        // Return true to indicate you wish to send a response asynchronously
        return true;
    } else {
        console.log("Unknown message type received or missing text.");
        sendResponse({ status: "error", message: "Unknown message type or missing text" });
    }
});

async function injectPromptText(text) {
    // --- SELECTOR LOGIC ---
    // IMPORTANT: These selectors might need updating if AI Studio's UI changes.
    // Try to find the "System instructions" textarea first.
    const systemInstructionSelector = 'textarea[aria-label="System instructions"], textarea[placeholder="System instructions"]';
    // Fallback: Try to find the main prompt input area.
    const mainPromptSelector = 'textarea[aria-label="Enter a prompt here"], textarea[placeholder^="Enter a prompt"], .input-area textarea'; // Added common placeholder/class patterns

    let targetElement = document.querySelector(systemInstructionSelector);

    if (!targetElement) {
        console.log("System instruction box not found, trying main prompt area...");
        targetElement = document.querySelector(mainPromptSelector);
    }

    if (!targetElement) {
        console.error("Could not find a suitable target textarea element on the page.");
        throw new Error("Target input/textarea not found.");
    }

    console.log("Found target element:", targetElement);

    // --- INJECTION LOGIC ---
    targetElement.value = text;

    // Simulate user input to ensure frameworks (like React/Angular) detect the change
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });

    targetElement.dispatchEvent(inputEvent);
    targetElement.dispatchEvent(changeEvent);

    // Optional: Focus the element after injecting
    targetElement.focus();

    return targetElement; // Return the element interacted with
}

/**
 * Adjusts the temperature setting in AI Studio
 * @param {number} temperature - Temperature value (0.0 to 1.0)
 * @returns {Promise<HTMLElement|null>} - Promise resolving to the temperature element that was adjusted
 */
async function adjustTemperature(temperature) {
    // Validate the temperature value
    const validTemperature = Math.max(0, Math.min(1, temperature));
    
    console.log(`Attempting to set temperature to: ${validTemperature}`);
    
    // Common selectors for temperature controls in AI Studio
    const possibleSelectors = [
        // Look for sliders with temperature in the label
        'input[type="range"][aria-label*="temperature" i], input[type="range"][aria-label*="Temperature" i]',
        // Look for sliders near temperature labels
        'label:contains("Temperature"), label:contains("temperature"), div:contains("Temperature") + div input[type="range"]',
        // Generic range input selectors that might be temperature controls
        '.temperature-slider input[type="range"]',
        '.parameter-controls input[type="range"]'
    ];
    
    // Try each selector
    let temperatureControl = null;
    for (const selector of possibleSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // If multiple elements found, try to find the one most likely to be temperature
                // based on its current value or nearby text
                for (const el of elements) {
                    // Check if it has a value between 0-1 (common for temperature)
                    if (el.value >= 0 && el.value <= 1) {
                        temperatureControl = el;
                        break;
                    }
                }
                // If we still didn't find a match, take the first one
                if (!temperatureControl && elements.length > 0) {
                    temperatureControl = elements[0];
                }
            }
        } catch (e) {
            console.log(`Selector "${selector}" failed:`, e);
        }
    }
    
    // If we still haven't found it, look more broadly for inputs with max=1
    if (!temperatureControl) {
        const allRangeInputs = document.querySelectorAll('input[type="range"]');
        for (const input of allRangeInputs) {
            if (input.max === "1" || input.max === 1) {
                console.log("Found potential temperature slider by max=1", input);
                temperatureControl = input;
                break;
            }
        }
    }
    
    // If we found a temperature control, set its value
    if (temperatureControl) {
        console.log("Found temperature control:", temperatureControl);
        
        // Store original value for logging
        const originalValue = temperatureControl.value;
        
        // Set the new value
        temperatureControl.value = validTemperature;
        
        // Trigger events to ensure the change is recognized by the app
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        
        temperatureControl.dispatchEvent(inputEvent);
        temperatureControl.dispatchEvent(changeEvent);
        
        console.log(`Temperature changed from ${originalValue} to ${validTemperature}`);
        
        return temperatureControl;
    } else {
        console.warn("Temperature control not found on the page");
        return null;
    }
}

// Custom implementation of jQuery-like :contains selector for finding elements containing text
document.querySelectorAll = (function(originalQuerySelectorAll) {
    return function(selector) {
        try {
            // Handle our custom :contains selector
            if (selector.includes(':contains(')) {
                const containsRegex = /:contains\(["']([^"']*)["']\)/;
                const match = selector.match(containsRegex);
                
                if (match && match[1]) {
                    const textToFind = match[1];
                    const baseSelector = selector.replace(/:contains\(["'][^"']*["']\)/, '');
                    
                    // Get base elements
                    const baseElements = originalQuerySelectorAll.call(document, baseSelector);
                    
                    // Filter for elements containing the text
                    return Array.from(baseElements).filter(el => {
                        return el.textContent && el.textContent.includes(textToFind);
                    });
                }
            }
            
            // Default behavior for standard selectors
            return originalQuerySelectorAll.call(document, selector);
        } catch (e) {
            console.error("Error in custom querySelectorAll:", e);
            return originalQuerySelectorAll.call(document, selector);
        }
    };
})(document.querySelectorAll);