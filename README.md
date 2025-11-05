# LM Studio Sidebar for Firefox

![License](https://img.shields.io/github/license/MrCryptographic/firefox-lm-studio-sidebar)  
[![Mozilla Add-on (NOT REVIEWED YET)](https://img.shields.io/badge/Firefox-Add--on-orange.svg)](https://addons.mozilla.org/en-US/developers/addon/lm-studio-sidebar/) <!-- TODO: Replace with your actual add-on link when available -->

A minimal, privacy-focused Firefox sidebar extension for chatting with your local AI models via an LM Studio server.

Bring the power of your local language models directly into your browser. This extension provides a seamless chat interface in the Firefox sidebar, connecting directly to your running LM Studio instance without ever leaving your current tab.

> **Note: Version 2.0 is a major upgrade!**  
> This version introduces persistent chat history, response regeneration, support for model "thinking," and a completely refreshed UI with better animations.

Extension in use (the model I used was a little dumb):  
<img width="602" height="996" alt="image" src="https://github.com/user-attachments/assets/5389e6b5-b6b4-424f-8241-2db4d53bc83c" />

---

## Key Features

*   **100% Local and Private:** All communication happens between the extension and your local machine. Your prompts and conversations never leave your computer.
*   **Persistent Chat History:** Close your browser and reopen it—your conversation will still be there. You can also clear the entire history with a single click.
*   **Regenerate Responses:** Not happy with an answer? Hover over the AI's message and click the regenerate button to get a new response to your last prompt.
*   **"Think Bubble" Support:** If your model uses `<think>` tags to outline its reasoning process, the extension will neatly display this in a separate "think bubble," keeping the main chat clean.
*   **Modern UI & Animations:** A clean, responsive interface with smooth animations for a professional user experience.
*   **Convenient Sidebar UI:** Chat with your AI without leaving your current webpage.
*   **Configurable Server URL:** Easily set the address and port of your LM Studio server from within the sidebar's settings panel.

## Requirements

1.  **Mozilla Firefox:** The extension is built for Firefox.
2.  **LM Studio:** You must have [LM Studio](https://lmstudio.ai/) installed and running.
3.  **A Local Model:** You need a language model downloaded and loaded within LM Studio.
4.  **Sufficient Hardware:** A computer with enough RAM and a capable GPU (recommended) to run local language models effectively.

## Installation

#### Option 1: From the Firefox Add-on Store (Recommended, but the extension isn't reviewed yet.)

The easiest way to install is directly from the official Mozilla Add-ons website.

> **[Install LM Studio Sidebar from Mozilla Add-ons](https://addons.mozilla.org/en-US/developers/addon/lm-studio-sidebar/)** <!-- TODO: Replace with your actual add-on link -->

#### Option 2: From Source (For Developers)

If you want to install the latest development version or modify the code:

1.  Clone this repository: `git clone https://github.com/MrCryptographic/firefox-lm-studio-sidebar.git`
2.  Open Firefox and navigate to `about:debugging`.
3.  Click on "This Firefox".
4.  Click the "Load Temporary Add-on..." button.
5.  Navigate to the cloned repository folder and select the `manifest.json` file.

## How to Use

1.  **Start the Server:** Open LM Studio, load a model, and go to the "Local Server" tab (`<->` icon, recently changed to <img width="136" height="39" alt="image" src="https://github.com/user-attachments/assets/4168c1ce-166d-49d0-b954-d912c25703b9" />). Click **Start Server**.
2.  **Open the Sidebar:** Click the LM Studio Sidebar icon in your Firefox toolbar.
3.  **Configure (If Needed):** By default, the extension will try to connect to `http://localhost:1234`. If your server is on a different address, click the cog icon (⚙️) in the sidebar's header to open the settings and enter the correct URL.
4.  **Start Chatting:** Type your prompt in the input box at the bottom and press Enter.
5.  **Interact:** Hover over an AI response to find the regenerate button (🔄). Use the trash can icon (🗑️) in the header to clear the chat history.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
