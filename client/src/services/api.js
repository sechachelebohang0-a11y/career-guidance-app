import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add request interceptor to include auth token
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('careerGuidanceUser') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Authentication API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
};

// Student API functions
export const studentAPI = {
  getCourses: () => API.get('/courses'),
  getApplications: (studentId) => API.get(`/applications/student/${studentId}`),
  applyForCourse: (applicationData) => API.post('/applications', applicationData),
};

// Institution API functions
export const institutionAPI = {
  getInstitutions: () => API.get('/institutions'),
  getInstitutionById: (id) => API.get(`/institutions/${id}`),
};

// Company API functions
export const companyAPI = {
  getJobs: () => API.get('/jobs'),
  postJob: (jobData) => API.post('/jobs', jobData),
  getApplicants: (companyId) => API.get(`/applicants/company/${companyId}`),
};

// Submit course application
export const submitCourseApplication = async (applicationData) => {
  try {
    const response = await fetch('/api/course-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      throw new Error('Application submission failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
};

export default API;