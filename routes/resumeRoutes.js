const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const puppeteer = require('puppeteer'); // Use puppeteer
const path = require('path');
const ejs = require('ejs'); // To render EJS template to string

// Serve the landing page
router.get('/', (req, res) => {
    res.render('index');
});

// Serve the resume form page
router.get('/build', (req, res) => {
    res.render('form');
});

// Handle resume form submission
router.post('/submit-resume', async (req, res) => {
    try {
        const {
            fullName, dobDay, dobMonth, dobYear, currentJobTitle, currentCompany, // Basic Details
            email, phone, // Contact
            summary, // Summary
            // Experience arrays
            expCompany, expRole, expDuration, expDescription,
            // Projects arrays
            projTitle, projTechStack, projDescription, projStatus,
            skills, // Comma-separated
            // Education arrays
            eduDegree, eduInstitution, eduYear, eduCgpa,
            // Certifications and Awards
            certTitle, certIssuingOrg, certCompletionDate, // Certifications
            awardTitle, awardOrganization, awardDate, // Awards
            // Address
            addressLine1, city, district, state, country, postalCode,
            // Social Links
            github, linkedin, portfolio, instagram,
            hobbies // Comma-separated
        } = req.body;

        let dob = null;
        if (dobDay && dobMonth && dobYear) {
            // Construct Date object. Note: Month is 0-indexed in JavaScript Date constructor.
            dob = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
            if (isNaN(dob.getTime())) { // Check if date is valid
                dob = null; // Set to null if date components don't form a valid date
            }
        }

        const experiences = [];
        if (expCompany && Array.isArray(expCompany)) {
            for (let i = 0; i < expCompany.length; i++) {
                if (expCompany[i]) { // Add only if company name is provided
                    experiences.push({
                        company: expCompany[i],
                        role: expRole[i] || '',
                        duration: expDuration[i] || '',
                        description: expDescription[i] || '',
                    });
                }
            }
        }

        const projects = [];
        if (projTitle && Array.isArray(projTitle)) {
            for (let i = 0; i < projTitle.length; i++) {
                 if (projTitle[i]) { // Add only if project title is provided
                    projects.push({
                        title: projTitle[i],
                        techStack: projTechStack[i] ? projTechStack[i].split(',').map(s => s.trim()) : [],
                        description: projDescription[i] || '',
                        status: projStatus[i] || '',
                    });
                }
            }
        }
        
        const educations = [];
        if (eduDegree && Array.isArray(eduDegree)) {
            for (let i = 0; i < eduDegree.length; i++) {
                if (eduDegree[i]) { // Add only if degree is provided
                    educations.push({
                        degree: eduDegree[i],
                        institution: eduInstitution[i] || '',
                        year: eduYear[i] || '',
                        cgpaOrPercentage: eduCgpa[i] || '',
                    });
                }
            }
        }

        const certifications = [];
        if (certTitle && Array.isArray(certTitle)) {
            for (let i = 0; i < certTitle.length; i++) {
                if (certTitle[i]) {
                    certifications.push({
                        title: certTitle[i],
                        issuingOrganization: certIssuingOrg[i] || '',
                        completionDate: certCompletionDate[i] || '',
                    });
                }
            }
        }

        const awards = [];
        if (awardTitle && Array.isArray(awardTitle)) {
            for (let i = 0; i < awardTitle.length; i++) {
                if (awardTitle[i]) {
                    awards.push({
                        title: awardTitle[i],
                        organization: awardOrganization[i] || '',
                        achievedDate: awardDate[i] || '',
                    });
                }
            }
        }

        const newResume = new Resume({
            basicDetails: { fullName, dob, currentJobTitle, currentCompany },
            contact: { email, phone },
            summary,
            experience: experiences,
            projects: projects,
            skills: skills ? skills.split(',').map(s => s.trim()) : [],
            education: educations,
            address: { addressLine1, city, district, state, country, postalCode },
            socialLinks: { github, linkedin, portfolio, instagram },
            hobbies: hobbies ? hobbies.split(',').map(s => s.trim()) : [],
            certifications: certifications,
            awards: awards,
        });

        const savedResume = await newResume.save();
        res.redirect(`/resume/${savedResume._id}`);
    } catch (error) {
        console.error('Error saving resume:', error);
        // Provide more detailed error message if it's a validation error
        if (error.name === 'ValidationError') {
            let messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).send('Validation Error: ' + messages.join(', '));
        }
        res.status(500).send('Error saving resume. Please try again. ' + error.message);
    }
});

// Display a specific resume (HTML preview)
router.get('/resume/:id', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).send('Resume not found');
        }
        res.render('resume-preview', { resume });
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).send('Error fetching resume');
    }
});

// PDF download route
router.get('/resume/:id/download', async (req, res) => {
    console.log(`[PDF Generation] Started for resume ID: ${req.params.id}`);
    let browser = null; 
    try {
        // Use env var if set (e.g. on Render); otherwise let Puppeteer use its bundled Chromium
        // const executablePathToUse = process.env.PUPPETEER_EXECUTABLE_PATH;

        const isTestMode = req.query.test === 'true';
        let htmlContent;
        let resumeDataForFileName = { basicDetails: { fullName: 'test-user' } }; 

        if (isTestMode) {
            console.log('[PDF Generation] Test mode activated. Using minimal HTML.');
            htmlContent = `<!DOCTYPE html><html><head><title>Test PDF</title></head><body><h1>Hello World - Test PDF</h1><p>This is a test PDF document generated at ${new Date().toISOString()}.</p><h2>Environment:</h2><p>PUPPETEER_EXECUTABLE_PATH (env): ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Not Set'}</p><p>PUPPETEER_CACHE_DIR (env): ${process.env.PUPPETEER_CACHE_DIR || 'Not Set'}</p></body></html>`;
        } else {
            const resume = await Resume.findById(req.params.id);
            if (!resume) {
                console.error(`[PDF Generation] Resume not found for ID: ${req.params.id}`);
                return res.status(404).send('Resume not found');
            }
            resumeDataForFileName = resume; // Use actual resume data for filename
            console.log('[PDF Generation] Resume data fetched.');
            htmlContent = await ejs.renderFile(
                path.join(__dirname, '../views/resume-pdf-template.ejs'), 
                { resume: resume, baseUrl: `${req.protocol}://${req.get('host')}` }
            );
        }
        console.log('[PDF Generation] HTML content prepared/rendered.');

        console.log('[PDF Generation] Puppeteer environment variables:');
        console.log(`  PUPPETEER_EXECUTABLE_PATH (env): ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
        // PUPPETEER_CACHE_DIR is not relevant for puppeteer-core in this setup
        
        // Prefer env var, else use Render's system Chrome/Chromium path
        const systemChrome = '/usr/bin/google-chrome-stable';
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || systemChrome;

        // Build launch options and always include executablePath
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            executablePath
        };

        // Try launch, fallback to no sandbox path if needed
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (err) {
            console.warn('[PDF Generation] launch failed, retrying without executablePath:', err.message);
            delete launchOptions.executablePath;
            browser = await puppeteer.launch(launchOptions);
        }
        if (!browser) {
            console.error('[PDF Generation] Failed to launch Puppeteer browser. Browser object is null.');
            return res.status(500).send('Error generating PDF: Could not initialize browser.');
        }
        console.log('[PDF Generation] Puppeteer browser launched.');
        
        const page = await browser.newPage();
        if (!page) {
            console.error('[PDF Generation] Failed to create new page. Page object is null.');
            if (browser) await browser.close(); // Ensure browser is closed
            return res.status(500).send('Error generating PDF: Could not create new page.');
        }
        console.log('[PDF Generation] Puppeteer page created.');
        
        await page.setDefaultNavigationTimeout(60000); 

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' }); 
        console.log('[PDF Generation] Page content set.');
        
        console.log('[PDF Generation] Generating PDF buffer...');
        const pdfOptions = {
            format: 'A4',
            printBackground: true,
            timeout: 60000 
        };
        if (!isTestMode) { // Only add margins for the actual resume, not the minimal test
            pdfOptions.margin = {
                top: '20mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            };
        } else {
            console.log('[PDF Generation] Test mode: Generating PDF without margins.');
        }

        const pdfBuffer = await page.pdf(pdfOptions);
        console.log(`[PDF Generation] PDF buffer generated. Size: ${pdfBuffer.length} bytes.`);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            console.error('[PDF Generation] Error: Generated PDF buffer is null or empty.');
            return res.status(500).send('Error generating PDF: Empty or null PDF buffer.');
        }

        // Advanced Debugging: Write to temp file (Uncomment if Render allows and issue persists)
        /*
        if (isTestMode) {
            try {
                tempPdfPath = path.join(os.tmpdir(), `test-pdf-${Date.now()}.pdf`);
                await fs.writeFile(tempPdfPath, pdfBuffer);
                console.log(`[PDF Generation] Test PDF written to temporary file: ${tempPdfPath}`);
                // At this point, you'd ideally have a way to inspect this file on the server
                // or try to serve it differently, but Render's free tier might not allow easy inspection.
            } catch (writeError) {
                console.error(`[PDF Generation] Error writing test PDF to temporary file: ${writeError}`);
            }
        }
        */

        const resumeFileName = isTestMode ? 
            'test-resume.pdf' : 
            `resume-${resumeDataForFileName.basicDetails.fullName.replace(/\s+/g, '_') || 'unknown'}-${req.params.id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length); 
        res.setHeader('Content-Disposition', `attachment; filename=${resumeFileName}`);
        
        res.write(pdfBuffer);
        res.end();
        console.log('[PDF Generation] PDF sent to client using res.write/res.end.');

    } catch (error) {
        console.error('[PDF Generation] Error in PDF generation process:', error);
        if (!res.headersSent) {
            res.status(500).send('Error generating PDF. ' + error.message);
        } else {
            console.error('[PDF Generation] Headers already sent, could not send error response to client.');
        }
    } finally {
        if (browser) {
            console.log('[PDF Generation] Closing Puppeteer browser...');
            await browser.close();
            console.log('[PDF Generation] Puppeteer browser closed.');
        }
        // Advanced Debugging: Clean up temp file (Uncomment if using temp file)
        /*
        if (tempPdfPath) {
            try {
                await fs.unlink(tempPdfPath);
                console.log(`[PDF Generation] Deleted temporary PDF file: ${tempPdfPath}`);
            } catch (unlinkError) {
                console.error(`[PDF Generation] Error deleting temporary PDF file: ${unlinkError}`);
            }
        }
        */
    }
});

// Fetch resume details for editing
router.get('/resume/:id/edit', async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).send('Resume not found');
        }
        res.render('resume-edit', { resume }); // Pass resume data to the view
    } catch (error) {
        console.error('Error fetching resume for editing:', error);
        res.status(500).send('Error fetching resume for editing');
    }
});

// Update resume details
router.post('/resume/:id/update', async (req, res) => {
    try {
        const updatedData = req.body;
        const resume = await Resume.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
        if (!resume) {
            return res.status(404).send('Resume not found');
        }
        res.redirect(`/resume/${resume._id}`);
    } catch (error) {
        console.error('Error updating resume:', error);
        res.status(500).send('Error updating resume');
    }
});



module.exports = router;
