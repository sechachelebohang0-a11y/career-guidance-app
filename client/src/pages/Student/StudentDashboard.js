import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import JobApplicationForm from '../../components/jobs/JobApplicationForm';
import CourseApplicationForm from '../../components/forms/CourseApplicationForm';
import AdmissionSelectionModal from '../../components/admissions/AdmissionSelectionModal';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import './StudentDashboard.css';

// Fixed DocumentUpload component with Firebase Storage
const DocumentUpload = ({ onUploadComplete, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, JPEG, or PNG files only');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    await uploadToFirebase(file);
  };

  const uploadToFirebase = async (file) => {
    if (!user) {
      alert('Please log in to upload documents');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Upload failed. Please try again.');
          setUploading(false);
          setProgress(0);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save document metadata to Firestore
            const docData = {
              name: file.name,
              type: file.type,
              size: file.size,
              url: downloadURL,
              studentId: user.uid,
              uploadedAt: new Date(),
              status: 'active'
            };

            const docRef = await addDoc(collection(db, 'documents'), docData);
            
            // Call the completion callback with document data
            onUploadComplete({
              id: docRef.id,
              ...docData
            });

            alert('Document uploaded successfully!');
          } catch (error) {
            console.error('Error saving document metadata:', error);
            alert('Document uploaded but failed to save metadata.');
          } finally {
            setUploading(false);
            setProgress(0);
          }
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const buttonStyle = {
    background: uploading ? '#6c757d' : '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: uploading ? 'not-allowed' : 'pointer',
    display: 'inline-block',
    textAlign: 'center'
  };

  const progressBarStyle = {
    width: '100%',
    height: '4px',
    background: '#e9ecef',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '0.5rem'
  };

  const progressStyle = {
    height: '100%',
    background: '#007bff',
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <input
        type="file"
        id="document-upload"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
      />
      <label htmlFor="document-upload" style={buttonStyle}>
        {uploading ? `Uploading... ${Math.round(progress)}%` : 'Upload Document'}
      </label>
      {uploading && (
        <div style={progressBarStyle}>
          <div style={progressStyle}></div>
        </div>
      )}
    </div>
  );
};

// Debounce hook utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const StudentDashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobApplication, setShowJobApplication] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseApplication, setShowCourseApplication] = useState(false);
  const [showAdmissionSelection, setShowAdmissionSelection] = useState(false);
  const [admissionOffers, setAdmissionOffers] = useState([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Use refs to prevent unnecessary re-renders
  const applicationsRef = useRef([]);
  const userDataRef = useRef(userData);

  // Update refs when data changes
  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudentApplications(),
        fetchCourses(),
        fetchInstitutions(),
        fetchJobs(),
        fetchNotifications(),
        fetchDocuments()
      ]);
      checkAdmissionOffers();
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Enhanced document fetching function
  const fetchDocuments = async () => {
    try {
      if (!user?.uid) return;

      // Try to fetch from Firebase first
      if (db) {
        const q = query(
          collection(db, 'documents'),
          where('studentId', '==', user.uid),
          orderBy('uploadedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const documentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(documentsList);
      } else {
        // Fallback to API call if Firebase not available
        const response = await fetch('/api/documents', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDocuments(data.documents || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // If both methods fail, set empty array
      setDocuments([]);
    }
  };

  // NEW: Handle document upload complete
  const handleDocumentUploadComplete = async (uploadedDoc) => {
    try {
      // Add the new document to the local state
      setDocuments(prev => [uploadedDoc, ...prev]);
      
      // Refresh the documents list to ensure consistency
      await fetchDocuments();
    } catch (error) {
      console.error('Error handling document upload:', error);
    }
  };

  // NEW: Enhanced document deletion
  const handleDeleteDocument = async (docId) => {
    try {
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this document?')) {
        return;
      }

      let success = false;

      // Try Firebase first
      if (db) {
        await deleteDoc(doc(db, 'documents', docId));
        success = true;
      } else {
        // Fallback to API call
        const response = await fetch(`/api/documents/${docId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          success = data.success;
        }
      }

      if (success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        alert('Document deleted successfully.');
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    }
  };

  // NEW: Handle document upload initiation
  const handleDocumentUpload = (type) => {
    setDocumentType(type);
    setShowDocumentUpload(true);
  };

  // NEW: Handle document upload success
  const handleDocumentUploadSuccess = () => {
    setShowDocumentUpload(false);
    setDocumentType('');
    fetchDocuments(); // Refresh the documents list
  };

  const fetchStudentApplications = async () => {
    try {
      const q = query(
        collection(db, 'applications'), 
        where('studentId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const applicationsList = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const appData = docSnap.data();
          
          const [courseDoc, institutionDoc] = await Promise.all([
            getDoc(doc(db, 'courses', appData.courseId)),
            getDoc(doc(db, 'institutions', appData.institutionId))
          ]);
          
          return {
            id: docSnap.id,
            ...appData,
            course: courseDoc.exists() ? courseDoc.data() : {},
            institution: institutionDoc.exists() ? institutionDoc.data() : {}
          };
        })
      );
      applicationsList.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setApplications(applicationsList);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchCourses = async () => {
    const q = query(collection(db, 'courses'), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    const coursesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCourses(coursesList);
  };

  const fetchInstitutions = async () => {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    const institutionsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setInstitutions(institutionsList);
  };

  // NEW: Check if student qualifies for job notifications
  const checkJobQualification = (job, studentData) => {
    if (!studentData || !job.requirements) return true; // Show all jobs if no requirements
    
    const jobRequirements = parseJobRequirements(job.requirements);
    const studentGrades = studentData.grades || [];
    
    // If job has no specific requirements, all qualified students can see it
    if (Object.keys(jobRequirements).length === 0) return true;
    
    // Check if student meets job requirements
    return meetsJobRequirements(studentGrades, jobRequirements);
  };

  // NEW: Parse job requirements
  const parseJobRequirements = (requirements) => {
    if (!requirements) return {};
    
    const parsed = {};
    
    try {
      if (typeof requirements === 'string') {
        // Handle different formats
        if (requirements.includes(':')) {
          const pairs = requirements.split(',');
          pairs.forEach(pair => {
            const [subject, grade] = pair.split(':').map(item => item.trim());
            if (subject && grade) {
              parsed[subject.toLowerCase()] = grade.toUpperCase();
            }
          });
        }
      } else if (typeof requirements === 'object') {
        Object.entries(requirements).forEach(([key, value]) => {
          parsed[key.toLowerCase()] = value.toString().toUpperCase();
        });
      }
    } catch (error) {
      console.error('Error parsing job requirements:', error);
    }
    
    return parsed;
  };

  // NEW: Check if student meets job requirements
  const meetsJobRequirements = (studentGrades, requirements) => {
    if (!studentGrades || studentGrades.length === 0) return false;
    if (Object.keys(requirements).length === 0) return true;

    const gradeHierarchy = {
      'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
    };

    for (const [requiredSubject, requiredGrade] of Object.entries(requirements)) {
      const studentGrade = studentGrades.find(grade => {
        const studentSubject = grade.subject.toLowerCase().trim();
        const requiredSubjectLower = requiredSubject.toLowerCase().trim();
        
        return studentSubject === requiredSubjectLower ||
               studentSubject.includes(requiredSubjectLower) ||
               requiredSubjectLower.includes(studentSubject);
      });
      
      if (!studentGrade) {
        return false; // Missing required subject
      }
      
      const studentPoints = gradeHierarchy[studentGrade.grade.toUpperCase()] || 0;
      const requiredPoints = gradeHierarchy[requiredGrade.toUpperCase()] || 0;
      
      if (studentPoints < requiredPoints) {
        return false; // Grade too low
      }
    }
    
    return true; // All requirements met
  };

  // UPDATED: Fetch only qualified jobs
  const fetchJobs = async () => {
    try {
      const q = query(
        collection(db, 'jobs'), 
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      const allJobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter jobs to only show those the student qualifies for
      const qualifiedJobs = allJobs.filter(job => 
        checkJobQualification(job, userDataRef.current)
      );
      
      qualifiedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setJobs(qualifiedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const notificationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notificationsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const limitedList = notificationsList.slice(0, 20);
      
      const unreadCount = limitedList.filter(notif => !notif.read).length;
      setUnreadNotifications(unreadCount);
      setNotifications(limitedList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // UPDATED: Check admission offers - show modal when student has at least one admitted application
  const checkAdmissionOffers = () => {
    // Get ALL admitted applications
    const admittedApplications = applicationsRef.current.filter(app => 
      app.status === 'admitted'
    );
    
    // Show modal if there are any admitted offers
    if (admittedApplications.length >= 1) {
      setAdmissionOffers(admittedApplications);
      setShowAdmissionSelection(true);
    }
  };

  // UPDATED: Enhanced Process waitlist when a student accepts an offer
  const processWaitlist = async (courseId, institutionId) => {
    try {
      // Get the course to check capacity
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) return;

      const course = courseDoc.data();
      
      // Count current accepted applications for this course
      const acceptedQuery = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId),
        where('status', '==', 'accepted')
      );
      const acceptedSnapshot = await getDocs(acceptedQuery);
      const currentEnrollment = acceptedSnapshot.size;

      // If course is at capacity, no need to process waitlist
      if (currentEnrollment >= course.capacity) return;

      // Get waitlisted applications for this course, ordered by application date
      const waitlistQuery = query(
        collection(db, 'applications'),
        where('courseId', '==', courseId),
        where('status', '==', 'waitlisted'),
        orderBy('appliedAt', 'asc')
      );
      const waitlistSnapshot = await getDocs(waitlistQuery);
      
      const slotsAvailable = course.capacity - currentEnrollment;
      const applicationsToAdmit = Math.min(slotsAvailable, waitlistSnapshot.size);
      
      if (applicationsToAdmit === 0) return;

      // Admit students from waitlist
      const admissionPromises = [];
      for (let i = 0; i < applicationsToAdmit; i++) {
        const waitlistedApp = waitlistSnapshot.docs[i];
        admissionPromises.push(
          updateDoc(doc(db, 'applications', waitlistedApp.id), {
            status: 'admitted',
            admittedAt: new Date(),
            admissionSource: 'waitlist_promotion'
          })
        );
        
        // Create notification for the waitlisted student
        const studentId = waitlistedApp.data().studentId;
        const notificationPromise = addDoc(collection(db, 'notifications'), {
          userId: studentId,
          message: `🎉 Congratulations! You have been admitted to ${course.name} from the waitlist.`,
          type: 'admission',
          read: false,
          createdAt: new Date()
        });
        admissionPromises.push(notificationPromise);
      }
      
      await Promise.all(admissionPromises);
      
      console.log(`Admitted ${applicationsToAdmit} students from waitlist for course ${course.name}`);
      
    } catch (error) {
      console.error('Error processing waitlist:', error);
      throw error;
    }
  };

  // UPDATED: Complete admission selection with automatic decline from other institutions
  const handleAdmissionSelection = async (selectedApplicationId) => {
    try {
      const selectedOffer = admissionOffers.find(offer => offer.id === selectedApplicationId);
      
      if (!selectedOffer) {
        throw new Error('Selected offer not found');
      }

      // 1. Accept the selected offer
      await updateDoc(doc(db, 'applications', selectedOffer.id), {
        status: 'accepted',
        acceptedAt: new Date()
      });

      // 2. Decline ALL other admission offers (not just the ones in modal)
      const allOtherApplications = applicationsRef.current.filter(app => 
        app.id !== selectedApplicationId
      );

      const declinePromises = allOtherApplications.map(offer => 
        updateDoc(doc(db, 'applications', offer.id), {
          status: 'declined',
          declinedAt: new Date(),
          declineReason: 'Student accepted another admission offer'
        })
      );

      await Promise.all(declinePromises);

      // 3. Process waitlist for the selected institution/course
      await processWaitlist(selectedOffer.courseId, selectedOffer.institutionId);
      
      setShowAdmissionSelection(false);
      setAdmissionOffers([]);
      fetchStudentApplications();
      
      alert('Admission selection confirmed! You have been enrolled in your chosen program and removed from other institutions.');
    } catch (error) {
      console.error('Error processing admission selection:', error);
      alert('Error processing your selection. Please try again.');
    }
  };

  // NEW: Function to manually trigger admission selection
  const handleManualAdmissionSelection = () => {
    const admittedApplications = applications.filter(app => app.status === 'admitted');
    if (admittedApplications.length > 0) {
      setAdmissionOffers(admittedApplications);
      setShowAdmissionSelection(true);
    } else {
      alert('You do not have any admission offers to select from.');
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      setUnreadNotifications(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      const updatePromises = unreadNotifications.map(notif =>
        updateDoc(doc(db, 'notifications', notif.id), {
          read: true,
          readAt: new Date()
        })
      );
      await Promise.all(updatePromises);
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // IMPROVED: Helper function to parse course requirements
  const parseCourseRequirements = (requirementsData) => {
    if (!requirementsData) return {};
    
    const requirements = {};
    
    try {
      if (typeof requirementsData === 'string') {
        if (requirementsData.includes(':')) {
          const pairs = requirementsData.split(',');
          
          pairs.forEach(pair => {
            const [subject, grade] = pair.split(':').map(item => item.trim());
            if (subject && grade) {
              requirements[subject.toLowerCase()] = grade.toUpperCase();
            }
          });
        } else if (requirementsData.includes('=')) {
          const pairs = requirementsData.split(',');
          
          pairs.forEach(pair => {
            const [subject, grade] = pair.split('=').map(item => item.trim());
            if (subject && grade) {
              requirements[subject.toLowerCase()] = grade.toUpperCase();
            }
          });
        }
      } else if (Array.isArray(requirementsData)) {
        requirementsData.forEach(item => {
          if (typeof item === 'string') {
            if (item.includes(':')) {
              const [subject, grade] = item.split(':').map(part => part.trim());
              if (subject && grade) {
                requirements[subject.toLowerCase()] = grade.toUpperCase();
              }
            } else if (item.includes('=')) {
              const [subject, grade] = item.split('=').map(part => part.trim());
              if (subject && grade) {
                requirements[subject.toLowerCase()] = grade.toUpperCase();
              }
            }
          } else if (typeof item === 'object') {
            Object.entries(item).forEach(([subject, grade]) => {
              if (subject && grade) {
                requirements[subject.toLowerCase()] = grade.toString().toUpperCase();
              }
            });
          }
        });
      } else if (typeof requirementsData === 'object') {
        Object.entries(requirementsData).forEach(([subject, grade]) => {
          if (subject && grade) {
            requirements[subject.toLowerCase()] = grade.toString().toUpperCase();
          }
        });
      }
    } catch (error) {
      console.error('Error parsing course requirements:', error);
    }
    
    return requirements;
  };

  // STRICT ELIGIBILITY CHECK: Only eligible if they meet ALL grade requirements
  const checkCourseEligibility = (course) => {
    if (!userDataRef.current) {
      console.log('No user data available');
      return false;
    }
    
    console.log('Checking eligibility for course:', course.name);
    
    // If course has requirements, student MUST meet them
    if (course.requirements) {
      const requirements = parseCourseRequirements(course.requirements);
      console.log('Parsed requirements:', requirements);
      
      if (Object.keys(requirements).length > 0) {
        // Student must have grades to check against requirements
        if (!userDataRef.current.grades || userDataRef.current.grades.length === 0) {
          console.log('Course has requirements but student has no grades - NOT eligible');
          return false;
        }
        
        const meetsRequirements = meetsGradeRequirements(userDataRef.current.grades, requirements);
        console.log('Meets requirements:', meetsRequirements);
        
        return meetsRequirements;
      } else {
        console.log('No specific grade requirements - eligible by default');
        return true; // No specific requirements = eligible
      }
    } else {
      console.log('No requirements - eligible by default');
      return true; // No requirements = eligible
    }
  };

  // STRICT: Grade requirements checking - must meet ALL requirements
  const meetsGradeRequirements = (studentGrades, requirements) => {
    if (!studentGrades || studentGrades.length === 0) return false;
    if (!requirements || Object.keys(requirements).length === 0) return true;

    const gradeHierarchy = {
      'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
    };

    console.log('STRICT: Checking grade requirements:', { requirements, studentGrades });

    for (const [requiredSubject, requiredGrade] of Object.entries(requirements)) {
      console.log(`Checking requirement: ${requiredSubject} needs ${requiredGrade}`);
      
      // Find matching student grade
      const studentGrade = studentGrades.find(grade => {
        const studentSubject = grade.subject.toLowerCase().trim();
        const requiredSubjectLower = requiredSubject.toLowerCase().trim();
        
        // Multiple matching strategies
        return studentSubject === requiredSubjectLower ||
               studentSubject.includes(requiredSubjectLower) ||
               requiredSubjectLower.includes(studentSubject) ||
               studentSubject.replace(/\s+/g, '') === requiredSubjectLower.replace(/\s+/g, '');
      });
      
      console.log(`Found student grade:`, studentGrade);
      
      if (!studentGrade) {
        console.log(`❌ Student doesn't have required subject: ${requiredSubject}`);
        return false;
      }
      
      const studentPoints = gradeHierarchy[studentGrade.grade.toUpperCase()] || 0;
      const requiredPoints = gradeHierarchy[requiredGrade.toUpperCase()] || 0;
      
      console.log(`Grade comparison: ${studentGrade.grade} (${studentPoints}) vs ${requiredGrade} (${requiredPoints})`);
      
      if (studentPoints < requiredPoints) {
        console.log(`❌ Grade too low: ${studentGrade.grade} < ${requiredGrade}`);
        return false;
      }
      
      console.log(`✅ Requirement met: ${requiredSubject} - ${studentGrade.grade} >= ${requiredGrade}`);
    }
    
    console.log('✅ ALL requirements met! Student is eligible.');
    return true;
  };

  const handleCourseApply = async (course) => {
    // Check if student already has 2 applications for this institution
    const institutionApplications = applicationsRef.current.filter(
      app => app.institutionId === course.institutionId
    );
    
    if (institutionApplications.length >= 2) {
      alert(`You can only apply for a maximum of 2 courses per institution. You already have ${institutionApplications.length} application(s) for this institution.`);
      return;
    }

    // STRICT: Check if student meets ALL course requirements
    const isEligible = checkCourseEligibility(course);
    console.log('Final eligibility result:', isEligible);

    if (!isEligible) {
      const requirements = parseCourseRequirements(course.requirements);
      let message = 'You do not meet the requirements for this course.';
      
      if (Object.keys(requirements).length > 0) {
        message += '\n\nRequired Grades:';
        Object.entries(requirements).forEach(([subject, grade]) => {
          message += `\n• ${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${grade} or better`;
        });
        
        if (userDataRef.current.grades) {
          message += '\n\nYour Grades:';
          userDataRef.current.grades.forEach(grade => {
            message += `\n• ${grade.subject}: ${grade.grade}`;
          });
        } else {
          message += '\n\nYou have not entered any grades in your profile.';
        }
      } else {
        message += '\n\nPlease add your grades to your profile to check eligibility.';
      }
      
      alert(message);
      return;
    }

    setSelectedCourse(course);
    setShowCourseApplication(true);
  };

  const handleCourseApplicationSuccess = () => {
    setShowCourseApplication(false);
    setSelectedCourse(null);
    fetchStudentApplications();
  };

  const deleteDocument = async (documentId) => {
    try {
      await deleteDoc(doc(db, 'documents', documentId));
      fetchDocuments();
      alert('Document deleted successfully.');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <StudentOverview 
            applications={applications} 
            jobs={jobs}
            notifications={notifications}
            unreadCount={unreadNotifications}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onAdmissionSelection={handleManualAdmissionSelection}
          />
        );
      case 'applications':
        return (
          <StudentApplications 
            applications={applications} 
            onAdmissionSelection={handleManualAdmissionSelection}
          />
        );
      case 'courses':
        return (
          <BrowseCourses 
            courses={courses} 
            institutions={institutions}
            applications={applications}
            onCourseApply={handleCourseApply}
            studentGrades={userData?.grades || []}
            studentData={userData}
          />
        );
      case 'jobs':
        return (
          <BrowseJobs 
            jobs={jobs} 
            onJobApply={(job) => {
              setSelectedJob(job);
              setShowJobApplication(true);
            }}
            studentData={userData}
          />
        );
      case 'documents':
        return (
          <StudentDocuments 
            documents={documents}
            onDocumentUpload={handleDocumentUpload}
            onDeleteDocument={handleDeleteDocument}
            onUploadComplete={handleDocumentUploadComplete}
          />
        );
      case 'notifications':
        return (
          <StudentNotifications 
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
          />
        );
      case 'profile':
        return <StudentProfile 
          studentData={userData} 
          onProfileUpdate={fetchStudentData}
          key={user?.uid}
        />;
      default:
        return <StudentOverview 
          applications={applications} 
          jobs={jobs}
          notifications={notifications}
          unreadCount={unreadNotifications}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
          onAdmissionSelection={handleManualAdmissionSelection}
        />;
    }
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome back, {userData?.name || user?.email}</p>
        <p>Role: <span className="user-role">{userData?.role}</span></p>
        {unreadNotifications > 0 && (
          <div className="notification-badge">
            {unreadNotifications} unread notification(s)
          </div>
        )}
      </div>

      <nav className="student-navbar">
        <ul>
          {['overview', 'applications', 'courses', 'jobs', 'documents', 'notifications', 'profile'].map(tab => (
            <li key={tab}>
              <button 
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'applications' && 'My Applications'}
                {tab === 'courses' && 'Browse Courses'}
                {tab === 'jobs' && 'Find Jobs'}
                {tab === 'documents' && 'My Documents'}
                {tab === 'notifications' && `Notifications ${unreadNotifications > 0 ? `(${unreadNotifications})` : ''}`}
                {tab === 'profile' && 'My Profile'}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="student-content">
        {renderTabContent()}
      </main>

      {/* Course Application Modal */}
      {showCourseApplication && selectedCourse && (
        <CourseApplicationForm 
          course={selectedCourse}
          studentData={userData}
          existingApplications={applications}
          onClose={() => {
            setShowCourseApplication(false);
            setSelectedCourse(null);
          }}
          onSuccess={handleCourseApplicationSuccess}
        />
      )}

      {/* Job Application Modal */}
      {showJobApplication && selectedJob && (
        <JobApplicationForm
          job={selectedJob}
          onClose={() => {
            setShowJobApplication(false);
            setSelectedJob(null);
          }}
          onSuccess={() => {
            setShowJobApplication(false);
            setSelectedJob(null);
            alert('Application submitted successfully!');
            fetchStudentApplications();
          }}
          studentId={user.uid}
          studentData={userData}
        />
      )}

      {/* Admission Selection Modal */}
      {showAdmissionSelection && admissionOffers.length > 0 && (
        <AdmissionSelectionModal
          offers={admissionOffers}
          onSelect={handleAdmissionSelection}
          onClose={() => setShowAdmissionSelection(false)}
        />
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <DocumentUploadModal
          documentType={documentType}
          studentId={user.uid}
          onClose={() => {
            setShowDocumentUpload(false);
            setDocumentType('');
          }}
          onSuccess={handleDocumentUploadSuccess}
          onUploadComplete={handleDocumentUploadComplete}
        />
      )}
    </div>
  );
};

// Enhanced Overview Component with Admission Selection Button
const StudentOverview = ({ applications, jobs, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onAdmissionSelection }) => {
  const stats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
    admittedApplications: applications.filter(app => app.status === 'admitted').length,
    acceptedApplications: applications.filter(app => app.status === 'accepted').length,
    availableJobs: jobs.length,
  };

  const recentNotifications = notifications.slice(0, 5);
  const hasAdmissionOffers = stats.admittedApplications > 0;

  return (
    <div className="student-overview">
      <h2></h2>
      
      
      
      
        
      
        
        
      

      <div className="overview-sections">
        <div className="recent-applications">
          <h3>Recent Applications</h3>
          <div className="applications-preview">
            {applications.slice(0, 3).map(application => (
              <div key={application.id} className="application-preview">
                <h4>{application.course?.name || 'Unknown Course'}</h4>
                <p>{application.institution?.name || 'Unknown Institution'}</p>
                <span className={`status status-${application.status}`}>
                  {application.status}
                </span>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="empty-state">No applications yet</div>
            )}
          </div>
        </div>

        <div className="recent-notifications">
          <div className="section-header">
            <h3>Recent Notifications</h3>
            {unreadCount > 0 && (
              <button className="btn-link" onClick={onMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notifications-preview">
            {recentNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <p className="notification-message">{notification.message}</p>
                <small>{formatDate(notification.createdAt)}</small>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="empty-state">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Applications Component with Admission Selection
const StudentApplications = ({ applications, onAdmissionSelection }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Under Review' },
      admitted: { class: 'status-admitted', label: 'Admitted' },
      accepted: { class: 'status-accepted', label: 'Enrolled' },
      declined: { class: 'status-declined', label: 'Declined' },
      rejected: { class: 'status-rejected', label: 'Not Admitted' },
      waitlisted: { class: 'status-waitlisted', label: 'Waitlisted' }
    };

    const config = statusConfig[status] || { class: 'status-pending', label: status };
    return <span className={`status ${config.class}`}>{config.label}</span>;
  };

  const admittedApplications = applications.filter(app => app.status === 'admitted');

  return (
    <div className="student-applications">
      <div className="section-header">
        <h2>My Course Applications</h2>
        {admittedApplications.length > 0 && (
          <button 
            className="btn-primary" 
            onClick={onAdmissionSelection}
          >
            Select Admission Offer ({admittedApplications.length})
          </button>
        )}
      </div>
      
      {admittedApplications.length > 0 && (
        <div className="admission-notice">
          <div className="alert alert-info">
            <h3>🎉 Admission Decision Required</h3>
            <p>You have been admitted to {admittedApplications.length} program(s). You must select one offer to enroll.</p>
            <p><strong>Note:</strong> When you select one offer, you will be automatically removed from all other institutions.</p>
          </div>
        </div>
      )}
      
      <div className="applications-list">
        {applications.map(application => (
          <div key={application.id} className="application-card">
            <div className="application-header">
              <div>
                <h3>{application.course?.name || 'Unknown Course'}</h3>
                <p>{application.institution?.name || 'Unknown Institution'}</p>
              </div>
              {getStatusBadge(application.status)}
            </div>
            
            <div className="application-details">
              <div className="detail-item">
                <strong>Course Duration:</strong>
                <span>{application.course?.duration || 'N/A'} years</span>
              </div>
              <div className="detail-item">
                <strong>Faculty:</strong>
                <span>{application.course?.facultyName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Applied Date:</strong>
                <span>{formatDate(application.appliedAt)}</span>
              </div>
              {application.reviewedAt && (
                <div className="detail-item">
                  <strong>Reviewed Date:</strong>
                  <span>{formatDate(application.reviewedAt)}</span>
                </div>
              )}
            </div>
            
            {application.status === 'admitted' && (
              <div className="admission-offer">
                <p>🎉 Congratulations! You have been admitted to this program.</p>
                <p><strong>Next Steps:</strong> You will need to select one admission offer if you have multiple offers.</p>
              </div>
            )}

            {application.status === 'accepted' && (
              <div className="admission-accepted">
                <p>✅ You have accepted this admission offer and are enrolled in the program.</p>
              </div>
            )}

            {application.status === 'waitlisted' && (
              <div className="waitlist-notice">
                <p>⏳ You are on the waitlist for this program.</p>
                <p><strong>Note:</strong> You may be admitted if spots become available.</p>
              </div>
            )}
          </div>
        ))}
        
        {applications.length === 0 && (
          <div className="empty-state">
            <p>You haven't submitted any course applications yet.</p>
            <p>Browse courses and apply to get started with your academic journey!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// UPDATED: Courses Component - Shows ONLY qualified courses by default, with option to see all
const BrowseCourses = ({ courses, institutions, applications, onCourseApply, studentGrades, studentData }) => {
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [viewMode, setViewMode] = useState('qualified'); // 'all' or 'qualified' - DEFAULT TO QUALIFIED

  const hasGrades = studentGrades && studentGrades.length > 0;

  // Helper function to parse course requirements
  const parseCourseRequirements = (requirementsData) => {
    if (!requirementsData) return {};
    
    const requirements = {};
    
    try {
      if (typeof requirementsData === 'string') {
        if (requirementsData.includes(':')) {
          const pairs = requirementsData.split(',');
          
          pairs.forEach(pair => {
            const [subject, grade] = pair.split(':').map(item => item.trim());
            if (subject && grade) {
              requirements[subject.toLowerCase()] = grade.toUpperCase();
            }
          });
        } else if (requirementsData.includes('=')) {
          const pairs = requirementsData.split(',');
          
          pairs.forEach(pair => {
            const [subject, grade] = pair.split('=').map(item => item.trim());
            if (subject && grade) {
              requirements[subject.toLowerCase()] = grade.toUpperCase();
            }
          });
        }
      } else if (Array.isArray(requirementsData)) {
        requirementsData.forEach(item => {
          if (typeof item === 'string') {
            if (item.includes(':')) {
              const [subject, grade] = item.split(':').map(part => part.trim());
              if (subject && grade) {
                requirements[subject.toLowerCase()] = grade.toUpperCase();
              }
            } else if (item.includes('=')) {
              const [subject, grade] = item.split('=').map(part => part.trim());
              if (subject && grade) {
                requirements[subject.toLowerCase()] = grade.toUpperCase();
              }
            }
          }
        });
      } else if (typeof requirementsData === 'object') {
        Object.entries(requirementsData).forEach(([subject, grade]) => {
          if (subject && grade) {
            requirements[subject.toLowerCase()] = grade.toString().toUpperCase();
          }
        });
      }
    } catch (error) {
      console.error('Error parsing course requirements:', error);
      return {};
    }
    
    return requirements;
  };

  // STRICT: Check if student meets ALL requirements
  const checkMeetsRequirements = (course) => {
    const requirements = parseCourseRequirements(course.requirements);
    
    // If course has no requirements, anyone can apply
    if (Object.keys(requirements).length === 0) return true;
    
    // If course has requirements but student has no grades, NOT eligible
    if (!hasGrades) return false;
    
    const gradeHierarchy = {
      'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
    };

    for (const [requiredSubject, requiredGrade] of Object.entries(requirements)) {
      // Find matching student grade
      const studentGrade = studentGrades.find(grade => {
        const studentSubject = grade.subject.toLowerCase().trim();
        const requiredSubjectLower = requiredSubject.toLowerCase().trim();
        
        return studentSubject === requiredSubjectLower ||
               studentSubject.includes(requiredSubjectLower) ||
               requiredSubjectLower.includes(studentSubject) ||
               studentSubject.replace(/\s+/g, '') === requiredSubjectLower.replace(/\s+/g, '');
      });
      
      if (!studentGrade) {
        return false; // Missing required subject
      }
      
      const studentPoints = gradeHierarchy[studentGrade.grade.toUpperCase()] || 0;
      const requiredPoints = gradeHierarchy[requiredGrade.toUpperCase()] || 0;
      
      if (studentPoints < requiredPoints) {
        return false; // Grade too low
      }
    }
    
    return true; // All requirements met
  };

  // Calculate GPA from student grades
  const calculateGPA = () => {
    if (!hasGrades) return 0;
    
    const gradePoints = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0, 'F': 0
    };
    
    const totalPoints = studentGrades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.grade.toUpperCase()] || 0);
    }, 0);
    
    return (totalPoints / studentGrades.length).toFixed(2);
  };

  // Check if student meets minimum GPA requirement for a course
  const checkMeetsGPARequirement = (course) => {
    if (!course.minGPA) return true; // No GPA requirement
    
    const studentGPA = parseFloat(calculateGPA());
    const requiredGPA = parseFloat(course.minGPA);
    
    return studentGPA >= requiredGPA;
  };

  // Comprehensive eligibility check - BOTH GPA and grade requirements
  const isCourseEligible = (course) => {
    // Check GPA requirement first
    if (!checkMeetsGPARequirement(course)) {
      return false;
    }
    
    // Then check specific grade requirements
    return checkMeetsRequirements(course);
  };

  // Get courses based on view mode
  const getCoursesToDisplay = () => {
    let filteredCourses = courses.filter(course => {
      if (selectedInstitution && course.institutionId !== selectedInstitution) return false;
      if (selectedFaculty && course.facultyName !== selectedFaculty) return false;
      return true;
    });

    // If viewing only qualified courses, filter them
    if (viewMode === 'qualified') {
      return filteredCourses.filter(course => isCourseEligible(course));
    }

    return filteredCourses;
  };

  const displayedCourses = getCoursesToDisplay();
  const faculties = [...new Set(courses.map(course => course.facultyName).filter(Boolean))];

  const getApplicationCount = (institutionId) => {
    return applications.filter(app => app.institutionId === institutionId).length;
  };

  const canApplyToInstitution = (institutionId) => {
    return getApplicationCount(institutionId) < 2;
  };

  // Count qualified courses
  const qualifiedCoursesCount = courses.filter(course => isCourseEligible(course)).length;
  const studentGPA = calculateGPA();

  // Helper to safely display requirements
  const displayRequirements = (requirementsData) => {
    if (!requirementsData) return 'No specific grade requirements.';
    
    if (typeof requirementsData === 'string') {
      return requirementsData;
    } else if (Array.isArray(requirementsData)) {
      return requirementsData.join(', ');
    } else if (typeof requirementsData === 'object') {
      return Object.entries(requirementsData)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value} or better`)
        .join(', ');
    }
    
    return String(requirementsData);
  };

  // Find student grade for a subject
  const findStudentGrade = (subject) => {
    return studentGrades.find(grade => {
      const studentSubject = grade.subject.toLowerCase().trim();
      const searchSubject = subject.toLowerCase().trim();
      
      return studentSubject === searchSubject ||
             studentSubject.includes(searchSubject) ||
             searchSubject.includes(studentSubject);
    });
  };

  return (
    <div className="browse-courses">
      <div className="section-header">
        <h2>Browse Courses</h2>
        <div className="gpa-display">
          {hasGrades && (
            <div className="gpa-badge">
              <strong>Your GPA:</strong> {studentGPA}
            </div>
          )}
        </div>
        <p className="section-description">
          {hasGrades 
            ? `You qualify for ${qualifiedCoursesCount} out of ${courses.length} courses based on your GPA and grades.`
            : "Add your grades in the Profile section to see which courses you qualify for."
          }
        </p>
      </div>

      <div className="view-mode-selector">
        <div className="view-buttons">
          <button 
            className={viewMode === 'qualified' ? 'active' : ''}
            onClick={() => setViewMode('qualified')}
          >
            Qualified Courses ({qualifiedCoursesCount})
          </button>
          <button 
            className={viewMode === 'all' ? 'active' : ''}
            onClick={() => setViewMode('all')}
          >
            All Courses ({courses.length})
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Institution:</label>
          <select 
            value={selectedInstitution} 
            onChange={(e) => setSelectedInstitution(e.target.value)}
          >
            <option value="">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({getApplicationCount(inst.id)}/2 applications)
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filter by Faculty:</label>
          <select 
            value={selectedFaculty} 
            onChange={(e) => setSelectedFaculty(e.target.value)}
          >
            <option value="">All Faculties</option>
            {faculties.map(faculty => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="courses-info-bar">
        <div className="info-stats">
          <span className="stat">
            <strong>Viewing:</strong> {viewMode === 'qualified' ? 'Only courses you qualify for' : 'All available courses'}
          </span>
          <span className="stat">
            <strong>Showing:</strong> {displayedCourses.length} courses
          </span>
          {hasGrades && (
            <>
              <span className="stat">
                <strong>Your GPA:</strong> {studentGPA}
              </span>
              <span className="stat">
                <strong>You Qualify For:</strong> {qualifiedCoursesCount} courses
              </span>
            </>
          )}
        </div>
      </div>

      {!hasGrades && viewMode === 'qualified' && (
        <div className="no-grades-message">
          <div className="alert alert-warning">
            <h3>📝 Add Your Grades First</h3>
            <p>You need to add your high school grades to see which courses you qualify for.</p>
            <ul>
              <li>Go to the <strong>My Profile</strong> section</li>
              <li>Add your subject grades</li>
              <li>Return here to see courses you can apply for</li>
            </ul>
            <p><strong>Note:</strong> Without grades, you cannot apply to any courses.</p>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {displayedCourses.map(course => {
          const institution = institutions.find(inst => inst.id === course.institutionId);
          const applicationCount = getApplicationCount(course.institutionId);
          const canApply = canApplyToInstitution(course.institutionId);
          const isEligible = isCourseEligible(course);
          const requirements = parseCourseRequirements(course.requirements);
          const hasRequirements = Object.keys(requirements).length > 0;
          const meetsGPA = checkMeetsGPARequirement(course);

          return (
            <div key={course.id} className={`course-card ${isEligible ? 'qualified' : 'not-qualified'}`}>
              <div className="course-header">
                <h3>{course.name}</h3>
                <div className="course-badges">
                  <span className="course-code">{course.code}</span>
                  {isEligible ? (
                    <span className="qualification-badge qualified">
                      ✅ You Qualify
                    </span>
                  ) : (
                    <span className="qualification-badge not-qualified">
                      ❌ Not Qualified
                    </span>
                  )}
                  {course.minGPA && (
                    <span className="gpa-requirement-badge">
                      Min GPA: {course.minGPA}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="course-details">
                <p><strong>Institution:</strong> {institution?.name || 'Unknown'}</p>
                <p><strong>Faculty:</strong> {course.facultyName}</p>
                <p><strong>Duration:</strong> {course.duration} years</p>
                <p><strong>Fees:</strong> M{course.fees || 'N/A'}</p>
                <p><strong>Capacity:</strong> {course.capacity} students</p>
                <p><strong>Applications to this institution:</strong> {applicationCount}/2</p>
                {course.minGPA && (
                  <p><strong>Minimum GPA Required:</strong> {course.minGPA}</p>
                )}
              </div>
              
              <div className="course-description">
                <p>{course.description || 'No description available.'}</p>
              </div>
              
              {/* GPA Requirement Check */}
              {course.minGPA && (
                <div className="gpa-requirement-check">
                  <h4>GPA Requirement:</h4>
                  <div className={`gpa-status ${meetsGPA ? 'met' : 'not-met'}`}>
                    {meetsGPA ? (
                      <p>✅ Your GPA ({studentGPA}) meets the requirement ({course.minGPA})</p>
                    ) : (
                      <p>❌ Your GPA ({studentGPA}) is below the requirement ({course.minGPA})</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="course-requirements">
                <h4>Minimum Grade Requirements:</h4>
                {hasRequirements ? (
                  <div className="requirements-list">
                    {Object.entries(requirements).map(([subject, grade]) => {
                      const studentGrade = findStudentGrade(subject);
                      const studentPoints = gradeHierarchy[studentGrade?.grade?.toUpperCase()] || 0;
                      const requiredPoints = gradeHierarchy[grade.toUpperCase()] || 0;
                      const meetsGrade = studentPoints >= requiredPoints;
                      
                      return (
                        <div key={subject} className={`requirement-item ${meetsGrade ? 'met' : 'not-met'}`}>
                          <span className="requirement-subject">{subject.charAt(0).toUpperCase() + subject.slice(1)}:</span>
                          <span className="requirement-grade">{grade} or better</span>
                          {studentGrade && (
                            <span className="student-grade">(Your grade: {studentGrade.grade})</span>
                          )}
                          {!studentGrade && hasGrades && (
                            <span className="student-grade missing">(You don't have this subject)</span>
                          )}
                          {!hasGrades && (
                            <span className="student-grade missing">(Add grades to check)</span>
                          )}
                          {meetsGrade && studentGrade && <span className="checkmark">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>{displayRequirements(course.requirements)}</p>
                )}
              </div>
              
              <div className="eligibility-status">
                <strong>Application Status: </strong>
                {isEligible ? (
                  <span className="eligible">✅ You qualify for this course</span>
                ) : (
                  <span className="not-eligible">
                    ❌ You do not meet the requirements for this course
                  </span>
                )}
              </div>
              
              <button 
                className={`btn-apply ${!canApply || !isEligible ? 'disabled' : ''}`} 
                onClick={() => onCourseApply(course)}
                disabled={!canApply || !isEligible}
              >
                {!isEligible ? 
                  'Not Qualified' 
                  : !canApply ? 
                  'Application Limit Reached' 
                  : 'Apply for this Course'
                }
              </button>
              
              {!canApply && (
                <p className="limit-warning">
                  You have reached the maximum of 2 applications for {institution?.name}.
                </p>
              )}
              
              {!isEligible && viewMode === 'all' && (
                <p className="eligibility-warning">
                  You don't meet the minimum requirements for this course. 
                  {!meetsGPA && course.minGPA && ` Your GPA (${studentGPA}) is below the required ${course.minGPA}.`}
                </p>
              )}
            </div>
          );
        })}
        
        {displayedCourses.length === 0 && (
          <div className="empty-state">
            <h3>No Courses Found</h3>
            <p>
              {viewMode === 'qualified' 
                ? "No courses match your qualifications with the current filters." 
                : "No courses match your current filters."
              }
            </p>
            <p>Try removing institution or faculty filters to see more courses.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Grade hierarchy for comparison
const gradeHierarchy = {
  'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
};

// UPDATED: Enhanced Jobs Component with qualification checking
const BrowseJobs = ({ jobs, onJobApply, studentData }) => {
  const { userData } = useAuth();
  
  const checkJobEligibility = (job) => {
    // If job has no requirements, all students can see it
    if (!job.requirements) return true;
    
    // Parse job requirements
    const parseJobRequirements = (requirements) => {
      if (!requirements) return {};
      const parsed = {};
      
      try {
        if (typeof requirements === 'string') {
          if (requirements.includes(':')) {
            const pairs = requirements.split(',');
            pairs.forEach(pair => {
              const [subject, grade] = pair.split(':').map(item => item.trim());
              if (subject && grade) {
                parsed[subject.toLowerCase()] = grade.toUpperCase();
              }
            });
          }
        }
      } catch (error) {
        console.error('Error parsing job requirements:', error);
      }
      return parsed;
    };

    const requirements = parseJobRequirements(job.requirements);
    const studentGrades = userData?.grades || [];
    
    // If no specific requirements, show job
    if (Object.keys(requirements).length === 0) return true;
    
    // If student has no grades, don't show job with requirements
    if (studentGrades.length === 0) return false;

    const gradeHierarchy = {
      'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
    };

    // Check if student meets all job requirements
    for (const [requiredSubject, requiredGrade] of Object.entries(requirements)) {
      const studentGrade = studentGrades.find(grade => {
        const studentSubject = grade.subject.toLowerCase().trim();
        const requiredSubjectLower = requiredSubject.toLowerCase().trim();
        
        return studentSubject === requiredSubjectLower ||
               studentSubject.includes(requiredSubjectLower) ||
               requiredSubjectLower.includes(studentSubject);
      });
      
      if (!studentGrade) {
        return false; // Missing required subject
      }
      
      const studentPoints = gradeHierarchy[studentGrade.grade.toUpperCase()] || 0;
      const requiredPoints = gradeHierarchy[requiredGrade.toUpperCase()] || 0;
      
      if (studentPoints < requiredPoints) {
        return false; // Grade too low
      }
    }
    
    return true; // All requirements met
  };

  return (
    <div className="browse-jobs">
      <div className="section-header">
        <h2>Available Job Opportunities</h2>
        <p className="section-description">
          Showing only jobs you qualify for based on your academic qualifications.
        </p>
      </div>
      
      <div className="jobs-grid">
        {jobs.map(job => {
          const isEligible = checkJobEligibility(job);
          
          return (
            <div key={job.id} className={`job-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className="job-type">{job.type}</span>
                {isEligible && (
                  <span className="eligibility-badge eligible">✅ You Qualify</span>
                )}
              </div>
              
              <div className="job-details">
                <p><strong>Company:</strong> {job.companyName}</p>
                <p><strong>Department:</strong> {job.department}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Salary:</strong> {job.salary}</p>
                <p><strong>Posted:</strong> {formatDate(job.createdAt)}</p>
                <p><strong>Application Deadline:</strong> {formatDate(job.deadline)}</p>
              </div>
              
              <div className="job-description">
                <p>{job.description}</p>
              </div>
              
              <div className="job-requirements">
                <h4>Requirements:</h4>
                <p>{job.requirements}</p>
              </div>

              <div className="job-qualifications">
                <h4>Preferred Qualifications:</h4>
                <p>{job.qualifications || 'Not specified'}</p>
              </div>
              
              <div className="job-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => onJobApply(job)}
                  disabled={!isEligible}
                >
                  {isEligible ? 'Apply Now' : 'Not Qualified'}
                </button>
                {!isEligible && (
                  <p className="eligibility-note">
                    You don't meet the minimum requirements for this position.
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {jobs.length === 0 && (
          <div className="empty-state">
            <p>No job opportunities available that match your qualifications.</p>
            <p>Check back later for new job postings or update your academic profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// UPDATED: Enhanced Student Documents Component with the requested functionality
const StudentDocuments = ({ documents, onDocumentUpload, onDeleteDocument, onUploadComplete }) => {
  const documentTypes = [
    { value: 'high_school_transcript', label: 'High School Transcript' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'id_copy', label: 'ID Copy' },
    { value: 'academic_transcript', label: 'Academic Transcript' },
    { value: 'degree_certificate', label: 'Degree Certificate' },
    { value: 'professional_certificate', label: 'Professional Certificate' },
    { value: 'other', label: 'Other Document' }
  ];

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(doc => doc.value === type);
    return docType ? docType.label : type;
  };

  // NEW: Function to handle file download/view
  const handleViewDocument = (document) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    } else {
      alert('Document URL not available');
    }
  };

  // NEW: Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="student-documents">
      <div className="section-header">
        <h2>My Documents</h2>
        <div className="document-actions">
          <select 
            onChange={(e) => e.target.value && onDocumentUpload(e.target.value)}
            className="document-type-select"
          >
            <option value="">Upload New Document</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                Upload {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>Upload New Document</h3>
        <DocumentUpload onUploadComplete={onUploadComplete} />
      </div>

      {/* Documents List */}
      <div className="documents-list">
        <h3>Uploaded Documents</h3>
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents uploaded yet.</p>
            <p>Upload your documents to keep them organized and accessible.</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map(doc => (
              <div key={doc.id} className="document-card">
                <div className="document-info">
                  <h4>{doc.name || getDocumentTypeLabel(doc.type)}</h4>
                  <p><strong>Type:</strong> {getDocumentTypeLabel(doc.type)}</p>
                  <p><strong>Uploaded:</strong> {formatDate(doc.uploadedAt)}</p>
                  <p><strong>Size:</strong> {formatFileSize(doc.size)}</p>
                </div>
                <div className="document-actions">
                  <button 
                    onClick={() => handleViewDocument(doc)}
                    className="btn btn-view"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => onDeleteDocument(doc.id)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="documents-guide">
        <h3>Document Upload Guide</h3>
        <ul>
          <li>Upload clear, legible scans of your documents</li>
          <li>Accepted formats: PDF, JPG, PNG</li>
          <li>Maximum file size: 5MB per document</li>
          <li>Keep your documents organized by type</li>
          <li>Recommended documents: High School Transcript, ID Copy, Birth Certificate</li>
        </ul>
      </div>
    </div>
  );
};

// Student Notifications Component
const StudentNotifications = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="student-notifications">
      <div className="section-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn-primary" onClick={onMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-card ${notification.read ? 'read' : 'unread'}`}
            onClick={() => !notification.read && onMarkAsRead(notification.id)}
          >
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <small className="notification-date">
                {formatDate(notification.createdAt)}
              </small>
            </div>
            {!notification.read && (
              <span className="unread-indicator">New</span>
            )}
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="empty-state">
            <p>No notifications at this time.</p>
            <p>You'll receive notifications about your applications, admissions, and job opportunities here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Student Profile Component
const StudentProfile = ({ studentData, onProfileUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    highSchool: '',
    graduationYear: '',
    address: '',
    dateOfBirth: '',
    grades: []
  });
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingGradeIndex, setEditingGradeIndex] = useState(null);
  const [newGrade, setNewGrade] = useState({ subject: '', grade: '' });

  const commonSubjects = [
    'Mathematics', 'English', 'Sesotho', 'Science', 'Biology', 
    'Physics', 'Chemistry', 'Accounting', 'Economics', 'Business Studies',
    'Geography', 'History', 'Computer Studies', 'Agriculture', 'Religious Studies'
  ];

  const gradeOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => {
    if (studentData && !initialDataLoaded) {
      setFormData({
        name: studentData.name || '',
        phone: studentData.phone || '',
        highSchool: studentData.highSchool || '',
        graduationYear: studentData.graduationYear || '',
        address: studentData.address || '',
        dateOfBirth: studentData.dateOfBirth || '',
        grades: studentData.grades || []
      });
      setInitialDataLoaded(true);
    }
  }, [studentData, initialDataLoaded]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
    setEditingGradeIndex(null);
    setNewGrade({ subject: '', grade: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddGrade = () => {
    if (!newGrade.subject || !newGrade.grade) {
      setError('Please select both subject and grade');
      return;
    }

    const subjectExists = formData.grades.some(grade => 
      grade.subject.toLowerCase() === newGrade.subject.toLowerCase()
    );

    if (subjectExists) {
      setError('This subject already exists in your grades');
      return;
    }

    setFormData({
      ...formData,
      grades: [...formData.grades, { ...newGrade }]
    });

    setNewGrade({ subject: '', grade: '' });
    setError('');
  };

  const handleEditGrade = (index) => {
    setEditingGradeIndex(index);
    setNewGrade({ ...formData.grades[index] });
  };

  const handleUpdateGrade = () => {
    if (!newGrade.subject || !newGrade.grade) {
      setError('Please select both subject and grade');
      return;
    }

    const updatedGrades = [...formData.grades];
    updatedGrades[editingGradeIndex] = { ...newGrade };

    setFormData({
      ...formData,
      grades: updatedGrades
    });

    setEditingGradeIndex(null);
    setNewGrade({ subject: '', grade: '' });
    setError('');
  };

  const handleDeleteGrade = (index) => {
    const updatedGrades = formData.grades.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      grades: updatedGrades
    });
  };

  const handleCancelGradeEdit = () => {
    setEditingGradeIndex(null);
    setNewGrade({ subject: '', grade: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      if (!formData.name.trim()) {
        throw new Error('Full name is required');
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...formData,
        updatedAt: new Date(),
        profileCompleted: true
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setInitialDataLoaded(false);
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (studentData) {
      setFormData({
        name: studentData.name || '',
        phone: studentData.phone || '',
        highSchool: studentData.highSchool || '',
        graduationYear: studentData.graduationYear || '',
        address: studentData.address || '',
        dateOfBirth: studentData.dateOfBirth || '',
        grades: studentData.grades || []
      });
    }
    setIsEditing(false);
    setEditingGradeIndex(null);
    setNewGrade({ subject: '', grade: '' });
    setError('');
    setSuccess('');
  };

  const calculateGPA = () => {
    if (!formData.grades || formData.grades.length === 0) return 0;
    
    const gradePoints = {
      'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0, 'F': 0
    };
    
    const totalPoints = formData.grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.grade] || 0);
    }, 0);
    
    return (totalPoints / formData.grades.length).toFixed(2);
  };

  const getGradeCount = (gradeLetter) => {
    return formData.grades.filter(grade => grade.grade === gradeLetter).length;
  };

  return (
    <div className="student-profile">
      <div className="section-header">
        <h2>My Profile</h2>
        <button 
          className={isEditing ? 'btn-secondary' : 'btn-primary'} 
          onClick={isEditing ? handleCancel : handleEditToggle}
          type="button"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      <div className="profile-card">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="profile-info">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={studentData?.email || ''}
                    disabled
                    className="form-input disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+266 XXX XXX"
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter your current address"
                  />
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Academic Information</h3>
              <div className="profile-info">
                <div className="form-group">
                  <label>High School</label>
                  <input
                    type="text"
                    name="highSchool"
                    value={formData.highSchool}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Name of your high school"
                  />
                </div>
                <div className="form-group">
                  <label>Graduation Year</label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="YYYY"
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>High School Grades</h3>
              <p className="section-description">
                <strong>IMPORTANT:</strong> Your grades determine which courses you can apply for. 
                You can only apply for courses where you meet ALL the grade requirements.
                <br />
                <span style={{color: '#dc3545', fontWeight: 'bold'}}>
                  Without grades, you cannot see or apply to any courses.
                </span>
              </p>
              
              <div className="grade-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject</label>
                    <select
                      value={newGrade.subject}
                      onChange={(e) => setNewGrade({...newGrade, subject: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select Subject</option>
                      {commonSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grade</label>
                    <select
                      value={newGrade.grade}
                      onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select Grade</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  {editingGradeIndex !== null ? (
                    <>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={handleUpdateGrade}
                      >
                        Update Grade
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={handleCancelGradeEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={handleAddGrade}
                    >
                      Add Grade
                    </button>
                  )}
                </div>
              </div>

              {formData.grades.length > 0 && (
                <div className="grades-list">
                  <h4>Your Grades:</h4>
                  <div className="grades-grid">
                    {formData.grades.map((grade, index) => (
                      <div key={index} className="grade-item">
                        <span className="grade-subject">{grade.subject}</span>
                        <span className={`grade-value grade-${grade.grade}`}>
                          {grade.grade}
                        </span>
                        <div className="grade-actions">
                          <button 
                            type="button"
                            className="btn-edit"
                            onClick={() => handleEditGrade(index)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDeleteGrade(index)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="profile-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="profile-info">
                <div className="info-item">
                  <strong>Full Name:</strong>
                  <span>{studentData?.name || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{studentData?.email}</span>
                </div>
                <div className="info-item">
                  <strong>Phone:</strong>
                  <span>{studentData?.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <strong>Date of Birth:</strong>
                  <span>{studentData?.dateOfBirth || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <strong>Address:</strong>
                  <span>{studentData?.address || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <strong>Student ID:</strong>
                  <span>{studentData?.uid || 'Not assigned'}</span>
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Academic Information</h3>
              <div className="profile-info">
                <div className="info-item">
                  <strong>High School:</strong>
                  <span>{studentData?.highSchool || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <strong>Graduation Year:</strong>
                  <span>{studentData?.graduationYear || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {studentData?.grades && studentData.grades.length > 0 && (
              <div className="profile-section">
                <h3>High School Grades</h3>
                <div className="grades-summary">
                  <div className="summary-stats">
                    <div className="stat">
                      <strong>Total Subjects:</strong>
                      <span>{studentData.grades.length}</span>
                    </div>
                    <div className="stat">
                      <strong>GPA:</strong>
                      <span>{calculateGPA()}</span>
                    </div>
                    <div className="stat">
                      <strong>A Grades:</strong>
                      <span>{getGradeCount('A')}</span>
                    </div>
                    <div className="stat">
                      <strong>B Grades:</strong>
                      <span>{getGradeCount('B')}</span>
                    </div>
                  </div>
                  
                  <div className="grades-display">
                    <h4>Subject Grades:</h4>
                    <div className="grades-grid">
                      {studentData.grades.map((grade, index) => (
                        <div key={index} className="grade-display-item">
                          <span className="grade-subject">{grade.subject}</span>
                          <span className={`grade-value grade-${grade.grade}`}>
                            {grade.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Utility function for date formatting
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

export default StudentDashboard;