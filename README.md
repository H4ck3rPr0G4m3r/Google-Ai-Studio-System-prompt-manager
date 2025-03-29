# AI Studio Prompter

A Chrome extension that allows you to inject custom system prompts and temperature settings into Google AI Studio.

## Overview

AI Studio Prompter streamlines your workflow when working with Google's AI Studio by allowing you to:

1. Save and manage multiple system prompts
2. Quickly inject saved prompts into the AI Studio interface 
3. Customize temperature settings for different creative needs
4. Easily switch between different prompt configurations

This extension is perfect for AI developers, content creators, and anyone who regularly uses Google AI Studio with different system prompts.

## Features

- **Prompt Management**: Save, organize, and delete custom system prompts
- **One-Click Injection**: Instantly apply saved prompts to Google AI Studio
- **Temperature Control**: Set specific temperature values (0.0 - 2.0) for each prompt
- **Persistent Storage**: Your prompts are saved locally between sessions
- **Smart Detection**: Automatically finds the right input field in AI Studio
- **Cross-Page Support**: Works across all pages within AI Studio

## Installation

### From Chrome Web Store (Recommended)
*Note: Once published to the Chrome Web Store, update these instructions*

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) and search for "AI Studio Prompter"
2. Click "Add to Chrome" 
3. Confirm the installation when prompted

### Manual Installation (Developer Mode)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension icon should now appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar to open the popup
2. To add a new prompt:
   - Click "+ Add New Prompt"
   - Enter a name for your prompt
   - Write your system prompt text
   - Set your desired temperature (between 0.0 and 2.0)
   - Click "Save Prompt"
3. To inject a saved prompt:
   - Navigate to [Google AI Studio](https://aistudio.google.com/)
   - Click the extension icon
   - Click "Inject" next to the prompt you want to use
4. If you navigate away from AI Studio, clicking "Inject" will open AI Studio in a new tab

### Managing Prompts

- **Delete a prompt**: Click the "X" button next to any saved prompt
- **View prompt details**: Hover over a prompt name to see the full prompt text
- **Connection issues**: If the extension doesn't inject properly, use the "Refresh Connection" button at the bottom of the popup

## Technical Details

The extension uses:
- Chrome Extension Manifest V3
- Content scripts for DOM injection
- Background service worker for cross-tab communication
- Local storage for saving prompts

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html/js` - User interface for managing prompts
- `content.js` - Handles prompt injection into AI Studio
- `background.js` - Manages extension state and communications
- `icons/` - Extension icons in various sizes

## Compatibility

- Works with Google Chrome and Chromium-based browsers
- Compatible with Google AI Studio (aistudio.google.com)
- Requires Chrome Extension Manifest V3 support

## Troubleshooting

**Prompt Not Injecting?**
1. Make sure you're on aistudio.google.com
2. Try clicking "Refresh Connection" at the bottom of the popup
3. Reload the AI Studio page and try again

**Extension Not Working?**
1. Check that the extension is enabled in chrome://extensions/
2. Verify that you have permitted the extension to access AI Studio
3. Try reinstalling the extension

## Privacy

This extension:
- Does not collect or transmit any user data
- Stores prompts locally in your browser's storage
- Only activates on aistudio.google.com domains
- Requires minimal permissions (only activeTab and scripting)

## License

This project is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Feedback & Contributions

For bug reports, feature requests, or contributions:
1. [Open an issue](https://github.com/yourusername/ai-studio-prompter/issues) on GitHub
2. Submit a pull request with proposed changes

---

*This extension is not affiliated with, endorsed by, or connected to Google Inc. or Google AI Studio.*