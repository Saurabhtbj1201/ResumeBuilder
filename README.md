# Resume Builder

A web application to create, preview, edit, and download ATS-friendly resumes as PDF using Node.js, Express, MongoDB, EJS templates, and Puppeteer.

## Features
- Interactive form to enter personal, education, experience, projects, skills, certifications, awards, address, social links, and hobbies.
- Preview resume in HTML with a clean, printable design.
- Generate PDF on demand via Puppeteer.
- Edit existing resumes.
- Dynamic form enhancements (add/remove entries) with vanilla JS.

## Logic & Stack
- **Server**: Node.js + Express  
- **DB**: MongoDB (Mongoose ODM)  
- **Views**: EJS templates for HTML preview and PDF rendering  
- **PDF**: Puppeteer (headless Chrome) renders an EJS template and streams PDF  
- **Client**: Vanilla JS for dynamic form sections  
- **Styling**: Responsive CSS  


## Folder Structure
```plaintext
resume-builder/
├─ public/
│  ├─ css/          # Stylesheets
│  └─ js/           # Client-side scripts
├─ routes/
│  └─ resumeRoutes.js
├─ views/
│  ├─ partials/     # header.ejs, footer.ejs
│  ├─ form.ejs
│  ├─ index.ejs
│  ├─ resume-preview.ejs
│  ├─ resume-pdf-template.ejs
│  └─ resume-edit.ejs
├─ models/
│  └─ Resume.js
├─ server.js
└─ README.md
```

## Getting Started
### Prerequisites
- Node.js ≥ 14
- MongoDB connection URI  
- (Optional) Puppeteer env vars: `PUPPETEER_EXECUTABLE_PATH`

### Installation
```bash
# Fork this repo on GitHub
git clone https://github.com/Saurabhtbj1201/ResumeBuilder.git
cd resume-builder
npm install
```

### Configuration
- Update `server.js` with your MongoDB URI or set `MONGO_URI` env var.
- (Optional) Set `PUPPETEER_EXECUTABLE_PATH` if using a custom Chrome binary.

### Run
```bash
npm start
# Visit http://localhost:3000
```

### Usage
1. **Build**: Navigate to `/build` to fill in your details.  
2. **Preview**: After submitting, view at `/resume/:id`.  
3. **Download**: Click “Download Resume” to get a PDF.  
4. **Edit**: Click “Edit Resume” to update entries.

## Live Demo
[https://resumebuilder-dpgw.onrender.com/](https://resumebuilder-dpgw.onrender.com/)
