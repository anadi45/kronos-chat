# Kronos Chat Client

This is the frontend application for the Kronos Chat system, built with React and TypeScript.

## Technology Stack

- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [ESLint](https://eslint.org/) - Pluggable JavaScript linter

## Project Structure

```
├── public/                 # Static assets
├── src/                    # Source code
│   ├── assets/             # Images, icons, and other assets
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API service calls
│   ├── styles/             # CSS/SCSS styles
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite environment types
├── index.html              # Main HTML file
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # TypeScript configuration for app
├── tsconfig.node.json      # TypeScript configuration for node
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview the production build:
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the production-ready application
- `npm run lint` - Runs ESLint to check for code issues
- `npm run preview` - Previews the production build locally

## Development Workflow

1. Create a feature branch for your work
2. Develop your feature using React and TypeScript
3. Ensure your code passes linting checks
4. Test your changes locally
5. Submit a pull request for review