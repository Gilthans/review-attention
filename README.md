# 🚀 Chrome Extension Installation Guide

Follow these steps to install this Chrome extension from source:

## Prerequisites

- Node.js and npm (or pnpm) installed
- Git installed

## Installation Steps

1. **Clone the repository:**

   ```sh
   git clone https://github.com/rezasohrabi/chrome-ext-starter.git
   cd chrome-ext-starter
   ```

2. **Install dependencies:**

   ```sh
   pnpm install
   ```

   _Or use `npm install` if you prefer._

3. **Build the extension:**

   ```sh
   pnpm build
   ```

   _Or use `npm run build`._

4. **Load the extension in Chrome:**
   - Open `chrome://extensions/` in your browser.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked".
   - Select the `dist` folder inside the project directory.

## Updating the Extension

- After making changes, run `pnpm build` again and reload the extension in Chrome.

---

For development, use `pnpm dev` to start the local server and rebuild automatically.
