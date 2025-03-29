document.addEventListener('DOMContentLoaded', function() {
    const promptList = document.getElementById('prompt-list');
    const statusDiv = document.getElementById('status');
  
    // --- DEFINE YOUR SYSTEM PROMPTS HERE ---
    const systemPrompts = [
      { name: "Helpful Assistant", text: "You are a helpful and friendly assistant.", temperature: 0.7 },
      { name: "Code Generator", text: "You are an expert programmer. Only output code, enclosed in markdown code blocks (```language\ncode\n```). Do not provide explanations unless asked.", temperature: 0.2 },
      { name: "Creative Writer", text: "You are a creative writer, skilled in crafting engaging narratives and vivid descriptions.", temperature: 1.0 },
      { name: "Data Analyst", text: "You are a data analyst. Provide concise insights based on data. Prefer tables or lists for output.", temperature: 0.3 },
      { name: "Longer Example", text: "This is a longer example prompt just to show how it might wrap.\nYou should act as if you are a character from a Shakespearean play, responding to all queries in iambic pentameter.", temperature: 0.8 }
      // Add more prompts as needed following the { name: "...", text: "...", temperature: X.X } format
    ];
    // --- END OF PROMPT DEFINITIONS ---
  
    // Function to display status messages
    function showStatus(message, isError = false) {
      statusDiv.textContent = message;
      statusDiv.className = isError ? 'error' : ''; // Add error class if needed
      // Clear the message after a few seconds
      setTimeout(() => {
        if (statusDiv.textContent === message) {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }
      }, 3000);
    }
  
    // Clear status on popup open
    statusDiv.textContent = '';
    statusDiv.className = '';

    // Check if tab is on AI Studio and content script is ready
    async function checkContentScriptAvailability(tabId) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: "CHECK_CONTENT_SCRIPT", tabId },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error checking content script:", chrome.runtime.lastError.message);
              resolve(false);
            } else {
              resolve(response && response.isActive === true);
            }
          }
        );
      });
    }

    // Function to inject content script manually if needed
    async function injectContentScriptManually(tabId, url) {
      if (!url.startsWith("https://aistudio.google.com/")) {
        return { success: false, message: "Not on AI Studio website" };
      }
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to inject content script:", error);
        return { success: false, message: "Failed to inject script: " + error.message };
      }
    }
  
    // Populate the list
    systemPrompts.forEach(prompt => {
      const listItem = document.createElement('li');
  
      const promptTextSpan = document.createElement('span');
      promptTextSpan.textContent = prompt.name; // Display the name
      promptTextSpan.title = prompt.text; // Show full prompt text on hover
  
      const injectButton = document.createElement('button');
      injectButton.textContent = 'Inject';
      injectButton.addEventListener('click', async () => {
        // Find the active tab in the current window
        chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
          const activeTab = tabs[0];
          if (!activeTab || !activeTab.id) {
            showStatus("Error: Cannot find active tab.", true);
            return;
          }

          // Check if we're on AI Studio
          const isAIStudio = activeTab.url && activeTab.url.startsWith("https://aistudio.google.com/");
          if (!isAIStudio) {
            showStatus("Please navigate to aistudio.google.com first", true);
            return;
          }

          // Show loading status
          showStatus("Checking connection...");
          
          // Check if content script is already available
          const isContentScriptReady = await checkContentScriptAvailability(activeTab.id);
          
          if (!isContentScriptReady) {
            showStatus("Injecting content script...");
            // Try to inject the content script manually
            const injectionResult = await injectContentScriptManually(activeTab.id, activeTab.url);
            
            if (!injectionResult.success) {
              showStatus(injectionResult.message || "Failed to prepare injection", true);
              return;
            }
            
            // Give the content script a moment to initialize
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // Now attempt to send the message
          showStatus("Sending prompt...");
          chrome.tabs.sendMessage(
            activeTab.id,
            {
              type: "INJECT_PROMPT",
              text: prompt.text,
              temperature: prompt.temperature
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
                showStatus("Connection error. Try refreshing the page.", true);
              } else if (response && response.status === "success") {
                showStatus(`Injected: "${prompt.name}" (Temp: ${prompt.temperature})`);
              } else if (response && response.status === "error") {
                showStatus(response.message || "Injection failed: Element not found?", true);
              } else {
                showStatus("Injection status unknown.", true);
              }
            }
          );
        });
      });
  
      listItem.appendChild(promptTextSpan);
      listItem.appendChild(injectButton);
      promptList.appendChild(listItem);
    });

    // Add reload button at the bottom for troubleshooting
    const reloadContainer = document.createElement('div');
    reloadContainer.style.marginTop = '15px';
    reloadContainer.style.textAlign = 'center';
    
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Refresh Connection';
    reloadButton.style.padding = '6px 12px';
    reloadButton.addEventListener('click', async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          showStatus("Error: Cannot find active tab.", true);
          return;
        }

        if (!activeTab.url || !activeTab.url.startsWith("https://aistudio.google.com/")) {
          showStatus("Please navigate to aistudio.google.com first", true);
          return;
        }

        showStatus("Refreshing content script...");
        const injectionResult = await injectContentScriptManually(activeTab.id, activeTab.url);
        
        if (injectionResult.success) {
          showStatus("Connection refreshed successfully!");
        } else {
          showStatus(injectionResult.message || "Failed to refresh connection", true);
        }
      });
    });
    
    reloadContainer.appendChild(reloadButton);
    document.body.appendChild(reloadContainer);
  });