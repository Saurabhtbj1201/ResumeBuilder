const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection URI
const mongoURI = 'mongodb+srv://saurabhtbj143:lLKjumjOuuyuvTWy@resume.3fizlja.mongodb.net/resumeData?retryWrites=true&w=majority&appName=resume';
// Added 'resumeData' as the database name in the URI, you can change it.

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected successfully!✅'))
    .catch(err => console.error('MongoDB connection error:❌', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files (CSS, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', resumeRoutes); // Mount resume routes

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
