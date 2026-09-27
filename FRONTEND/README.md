# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # HireFlow Frontend
  {
  The frontend is built with React, TypeScript, and Vite. It currently contains the initial application scaffold.
    extends: [
  ## Requirements

  - Node.js and npm
      // Alternatively, use this for stricter rules
  ## Setup and Development
      // Optionally, add this for stylistic rules
  From the repository root, install dependencies and start the Vite development server:

  ```powershell
  cd FRONTEND
  npm ci
  npm run dev
  ```
    ],
  Vite prints the local URL in the terminal when the server starts.
      parserOptions: {
  ## Scripts

  ```powershell
  npm run dev      # Start the development server
  npm run build    # Type-check and create a production build
  npm run lint     # Run ESLint
  npm run preview  # Serve the production build locally
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
  The frontend does not currently read API URL environment variables. For backend setup and API documentation, see [the backend README](../BACKEND/README.md).
    languageOptions: {
import reactX from 'eslint-plugin-react-x'
