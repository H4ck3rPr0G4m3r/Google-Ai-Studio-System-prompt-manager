document.addEventListener('DOMContentLoaded', function() {
    const promptList = document.getElementById('prompt-list');
    const statusDiv = document.getElementById('status');
    const toggleAddFormBtn = document.getElementById('toggle-add-form');
    const addForm = document.getElementById('add-form');
    const addPromptBtn = document.getElementById('add-prompt');
    const cancelAddBtn = document.getElementById('cancel-add');
    const nameInput = document.getElementById('prompt-name');
    const textInput = document.getElementById('prompt-text');
    const temperatureInput = document.getElementById('prompt-temperature');
  
    // Default prompt to use when no prompts exist
    const defaultPrompt = { 
      id: 'default-prompt', 
      name: "Default Assistant", 
      text: "You are a helpful and friendly assistant.", 
      temperature: 0.7 
    };
  
    // Function to display status messages
    function showStatus(message, isError = false) {
      statusDiv.textContent = message;
      statusDiv.className = isError ? 'error' : '';
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

    // Toggle add form visibility
    toggleAddFormBtn.addEventListener('click', function() {
      if (addForm.style.display === 'block') {
        addForm.style.display = 'none';
        toggleAddFormBtn.textContent = '+ Add New Prompt';
      } else {
        addForm.style.display = 'block';
        toggleAddFormBtn.textContent = '- Hide Form';
        nameInput.focus();
      }
    });

    // Cancel add form
    cancelAddBtn.addEventListener('click', function() {
      addForm.style.display = 'none';
      toggleAddFormBtn.textContent = '+ Add New Prompt';
      // Clear inputs
      nameInput.value = '';
      textInput.value = '';
      temperatureInput.value = '0.7';
    });

    // Function to save prompts to localStorage
    function savePrompts(prompts) {
      try {
        localStorage.setItem('aiStudioPrompts', JSON.stringify(prompts));
        return true;
      } catch (error) {
        console.error('Error saving prompts to localStorage:', error);
        return false;
      }
    }

    // Function to get prompts from localStorage
    function getPrompts() {
      try {
        const promptsJson = localStorage.getItem('aiStudioPrompts');
        return promptsJson ? JSON.parse(promptsJson) : [];
      } catch (error) {
        console.error('Error reading prompts from localStorage:', error);
        return [];
      }
    }

    // Add new prompt
    addPromptBtn.addEventListener('click', function() {
      const name = nameInput.value.trim();
      const text = textInput.value.trim();
      const temperature = parseFloat(temperatureInput.value);
      
      // Validate inputs
      if (!name) {
        showStatus('Please enter a prompt name', true);
        nameInput.focus();
        return;
      }
      if (!text) {
        showStatus('Please enter prompt text', true);
        textInput.focus();
        return;
      }
      if (isNaN(temperature) || temperature < 0 || temperature > 2) {
        showStatus('Temperature must be between 0.0 and 2.0', true);
        temperatureInput.focus();
        return;
      }
      
      // Create new prompt object
      const newPrompt = {
        id: 'prompt-' + Date.now(),
        name,
        text,
        temperature
      };
      
      // Add to storage
      const prompts = getPrompts();
      prompts.push(newPrompt);
      
      if (savePrompts(prompts)) {
        // Reset form
        nameInput.value = '';
        textInput.value = '';
        temperatureInput.value = '0.7';
        
        // Hide form
        addForm.style.display = 'none';
        toggleAddFormBtn.textContent = '+ Add New Prompt';
        
        showStatus('Prompt added successfully');
        
        // Refresh prompt list
        loadPrompts();
      } else {
        showStatus('Failed to save prompt', true);
      }
    });

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
  
    // Function to create a prompt list item
    function createPromptListItem(prompt) {
      const listItem = document.createElement('li');
      listItem.dataset.id = prompt.id;
  
      const promptTextSpan = document.createElement('span');
      promptTextSpan.textContent = prompt.name;
      promptTextSpan.title = prompt.text; // Show full prompt text on hover
  
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'prompt-actions';
      
      const injectButton = document.createElement('button');
      injectButton.textContent = 'Inject';
      injectButton.addEventListener('click', async () => {
        injectPrompt(prompt);
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';  // Using plain 'X' instead of Unicode character
      deleteButton.title = 'Delete prompt';
      deleteButton.addEventListener('click', function() {
        if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
          deletePrompt(prompt.id);
        }
      });
      
      actionsDiv.appendChild(injectButton);
      actionsDiv.appendChild(deleteButton);
  
      listItem.appendChild(promptTextSpan);
      listItem.appendChild(actionsDiv);
      return listItem;
    }

    // Function to inject a prompt
    async function injectPrompt(prompt) {
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
    }

    // Function to delete a prompt
    function deletePrompt(id) {
      let prompts = getPrompts();
      prompts = prompts.filter(prompt => prompt.id !== id);
      
      if (savePrompts(prompts)) {
        showStatus('Prompt deleted successfully');
        loadPrompts(); // Refresh list
        
        // Show message if all prompts are deleted
        if (prompts.length === 0) {
          showStatus('All prompts deleted. Add a new prompt or refresh to restore default.');
        }
      } else {
        showStatus('Failed to delete prompt', true);
      }
    }

    // Function to load and display prompts
    function loadPrompts() {
      // Clear current list
      promptList.innerHTML = '';
      
      // Get prompts from storage
      let prompts = getPrompts();
      
      // If no prompts exist, add the default prompt but only on initial load
      if (prompts.length === 0 && !localStorage.getItem('defaultDeleted')) {
        prompts = [defaultPrompt];
        savePrompts(prompts);
      }
      
      // Add each prompt to the list
      prompts.forEach(prompt => {
        const listItem = createPromptListItem(prompt);
        promptList.appendChild(listItem);
      });
      
      // If there are no prompts, show a message
      if (prompts.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No prompts available. Add a new one to get started.';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#666';
        emptyMsg.style.padding = '20px 0';
        promptList.appendChild(emptyMsg);
      }
    }
    
    // Initial load of prompts
    loadPrompts();

    // Set up refresh connection button
    document.getElementById('refresh-connection').addEventListener('click', async () => {
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
  });