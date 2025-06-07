const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const puppeteer = require('puppeteer'); // For PDF generation
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
    try {
        const resume = await Resume.findById(req.params.id);
        if (!resume) {
            return res.status(404).send('Resume not found');
        }

        // Render an EJS template to an HTML string
        // We'll create 'resume-pdf-template.ejs' for this
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, '../views/resume-pdf-template.ejs'), 
            { resume: resume, baseUrl: `${req.protocol}://${req.get('host')}` } // Pass resume data and baseUrl for static assets
        );

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important for running in some environments
        });
        const page = await browser.newPage();
        
        // Set content and wait for images/styles if any are loaded via network
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' }); 
        
        // Emulate screen media type for better print layout consistency
        await page.emulateMediaType('screen'); 

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Crucial for including CSS background colors/images
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=resume-${resume.basicDetails.fullName.replace(/\s+/g, '_')}-${resume._id}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF. ' + error.message);
    }
});


module.exports = router;
