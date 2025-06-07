const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    company: String,
    role: String,
    duration: String,
    description: String,
});

const projectSchema = new mongoose.Schema({
    title: String,
    techStack: [String],
    description: String,
    status: String,
});

const educationSchema = new mongoose.Schema({
    degree: String,
    institution: String,
    year: String,
    cgpaOrPercentage: String,
});

const resumeSchema = new mongoose.Schema({
    basicDetails: {
        fullName: { type: String, required: true },
        dob: Date,
        currentJobTitle: String,
        currentCompany: String,
    },
    contact: {
        email: { type: String, required: true },
        phone: String,
    },
    summary: String,
    experience: [experienceSchema],
    projects: [projectSchema],
    skills: [String],
    education: [educationSchema],
    address: {
        addressLine1: String,
        city: String,
        district: String,
        state: String,
        country: String,
        postalCode: String,
    },
    socialLinks: {
        github: String,
        linkedin: String,
        portfolio: String,
        instagram: String,
    },
    hobbies: [String],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Resume', resumeSchema);
