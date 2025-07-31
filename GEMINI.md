## Project Overview

This project is a web-based PDF page splitter. It allows users to upload a PDF file, select specific pages, and then download a new PDF containing only those selected pages. The entire application runs in the browser, and no files are uploaded to a server.

### Key Files and Directories

- **`App.tsx`**: The main React component that contains the entire application logic and UI. It manages the application state, handles user interactions, and renders the different views of the application.
- **`index.html`**: The main HTML file that loads the necessary scripts and styles. It includes the CDN links for `pdf-lib` and `pdf.js`, and also contains the basic HTML structure of the application.
- **`index.tsx`**: The entry point of the React application. It renders the `App` component into the DOM.
- **`components/`**: Contains reusable React components.
  - **`icons.tsx`**: A set of SVG icons used in the application.
  - **`ui/`**: Contains UI components like `Button.tsx`, `Card.tsx`, and `Input.tsx`. These components are styled using Tailwind CSS and are used to build the application's UI.
- **`lib/`**: Contains utility functions.
  - **`utils.ts`**: Contains a utility function for merging CSS classes.
- **`package.json`**: Defines the project's dependencies and scripts. It includes the dependencies for React, TypeScript, and Vite.
- **`vite.config.ts`**: The configuration file for the Vite development server. It is used to configure the development server and the build process.
- **`tsconfig.json`**: The configuration file for the TypeScript compiler. It specifies the compiler options for the project.

### Libraries and Frameworks

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server for modern web projects.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **pdf-lib**: A JavaScript library for creating and modifying PDF documents. It is used to create the new PDF with the selected pages.
- **pdf.js**: A library for parsing and rendering PDF files. It is used to render the previews of the PDF pages.