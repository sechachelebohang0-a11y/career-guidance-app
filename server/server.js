const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin with service account file
try {
  const serviceAccount = require('./firebase-service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://career-platform-22039.firebaseio.com`
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  console.log('⚠️  Continuing without Firebase Admin (using mock data)');
}

const db = admin.firestore();

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  try {
    // Mock authentication
    if (email && password) {
      const users = {
        student: { id: 1, email, role: 'student', name: 'John Student' },
        admin: { id: 2, email, role: 'admin', name: 'Admin User' },
        institution: { id: 3, email, role: 'institution', name: 'NUL Admin' },
        company: { id: 4, email, role: 'company', name: 'Econet HR' }
      };
      
      const user = users[role];
      if (user) {
        res.json({
          success: true,
          user,
          token: 'mock-jwt-token'
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Course application endpoint
app.post('/api/applications', async (req, res) => {
  const { studentId, courseId, studentName, email, qualifications } = req.body;
  
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      const application = {
        id: Math.random().toString(36).substr(2, 9),
        studentId,
        courseId,
        studentName,
        email,
        qualifications,
        status: 'pending',
        appliedDate: new Date().toISOString(),
        applicationId: `APP${Date.now()}`
      };
      
      return res.json({
        success: true,
        application,
        message: 'Application submitted successfully! (Mock data)'
      });
    }

    const applicationId = `APP${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
    
    const application = {
      studentId,
      courseId,
      studentName,
      email,
      qualifications,
      status: 'pending',
      appliedDate: new Date(),
      applicationId: applicationId
    };
    
    const docRef = await db.collection('applications').add(application);
    
    res.json({
      success: true,
      application: { id: docRef.id, ...application },
      message: 'Application submitted successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get applications by student
app.get('/api/applications/student/:studentId', async (req, res) => {
  const studentId = req.params.studentId;
  
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      return res.json({
        success: true,
        applications: []
      });
    }

    const snapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .orderBy('appliedDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Job posting endpoints
app.post('/api/jobs', async (req, res) => {
  const { companyId, title, department, description, requirements, qualifications } = req.body;
  
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      const job = {
        id: Math.random().toString(36).substr(2, 9),
        companyId,
        title,
        department,
        description,
        requirements,
        qualifications,
        status: 'active',
        postedDate: new Date().toISOString(),
        applications: 0
      };
      
      return res.json({
        success: true,
        job,
        message: 'Job posted successfully! (Mock data)'
      });
    }

    const job = {
      companyId,
      title,
      department,
      description,
      requirements,
      qualifications,
      status: 'active',
      postedDate: new Date(),
      applications: 0
    };
    
    const docRef = await db.collection('jobs').add(job);
    
    res.json({
      success: true,
      job: { id: docRef.id, ...job },
      message: 'Job posted successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      return res.json({
        success: true,
        jobs: [
          {
            id: '1',
            companyId: 'econet',
            companyName: 'Econet Telecom Lesotho',
            title: 'Software Developer',
            department: 'IT Department',
            description: 'We are looking for a skilled Software Developer...',
            requirements: 'Bachelor\'s degree in Computer Science...',
            status: 'active',
            postedDate: new Date().toISOString(),
            applications: 0
          }
        ]
      });
    }

    const snapshot = await db.collection('jobs')
      .orderBy('postedDate', 'desc')
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get courses from Firebase
app.get('/api/courses', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      return res.json({
        success: true,
        courses: [
          { 
            id: 1, 
            name: 'Computer Science', 
            institution: 'National University of Lesotho',
            duration: '4 years',
            requirements: 'Mathematics and Physical Science',
            availableSlots: 50,
            description: 'Learn programming, algorithms, and software development'
          },
          { 
            id: 2, 
            name: 'Business Administration', 
            institution: 'Lerotholi Polytechnic',
            duration: '3 years',
            requirements: 'Mathematics and English',
            availableSlots: 75,
            description: 'Business management and administration skills'
          }
        ]
      });
    }

    const snapshot = await db.collection('courses').get();
    const courses = [];
    snapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get institutions from Firebase
app.get('/api/institutions', async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      // Fallback to mock data
      return res.json({
        success: true,
        institutions: [
          {
            id: 1,
            name: 'National University of Lesotho',
            location: 'Roma, Lesotho',
            type: 'Public University',
            established: 1945
          },
          {
            id: 2,
            name: 'Lerotholi Polytechnic',
            location: 'Maseru, Lesotho',
            type: 'Technical College',
            established: 1905
          }
        ]
      });
    }

    const snapshot = await db.collection('institutions').get();
    const institutions = [];
    snapshot.forEach(doc => {
      institutions.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({
      success: true,
      institutions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  const firebaseStatus = db ? 'Connected' : 'Not connected (using mock data)';
  
  res.json({ 
    message: 'Career Guidance Backend is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'career-platform-22039',
    firebase: firebaseStatus
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔥 Firebase Status: ${db ? 'Connected' : 'Using mock data'}`);
  console.log(`🔐 Authentication: POST /api/auth/login`);
  console.log(`📝 Applications: POST /api/applications`);
  console.log(`💼 Jobs: POST /api/jobs, GET /api/jobs`);
  console.log(`🎓 Courses: GET /api/courses`);
  console.log(`🏫 Institutions: GET /api/institutions`);
});