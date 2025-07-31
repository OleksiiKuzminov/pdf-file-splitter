# PDF Page Splitter

This is a web-based utility for splitting PDF files. It allows users to upload a PDF, select the pages they want to keep, and download a new PDF containing only the selected pages. The entire application runs in the browser, and no files are uploaded to a server.

## Features

- **Upload PDF**: Upload a PDF file from your computer via a file browser or by dragging and dropping it onto the application.
- **Page Selection**: Select individual pages or a range of pages to include in the new PDF.
- **Page Previews**: See a preview of each page of the PDF.
- **Download**: Download the new PDF with the selected pages.
- **Error Handling**: The application handles errors such as invalid file types and password-protected PDFs.
- **Responsive Design**: The application is designed to work on a variety of screen sizes.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **PDF Processing**:
  - [pdf-lib](https://pdf-lib.js.org/): For creating and modifying PDF documents.
  - [pdf.js](https://mozilla.github.io/pdf.js/): For parsing and rendering PDF files.
- **Build Tool**: Vite

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173` (or whatever port Vite assigns).
