import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchInstitutions(),
        fetchCompanies(),
        fetchUsers(),
        fetchFaculties(),
        fetchCourses(),
        fetchAdmissions(),
        fetchReports()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    const institutionsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setInstitutions(institutionsList);
  };

  const fetchCompanies = async () => {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    const companiesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCompanies(companiesList);
  };

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersList);
  };

  const fetchFaculties = async () => {
    const querySnapshot = await getDocs(collection(db, 'faculties'));
    const facultiesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setFaculties(facultiesList);
  };

  const fetchCourses = async () => {
    const querySnapshot = await getDocs(collection(db, 'courses'));
    const coursesList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCourses(coursesList);
  };

  const fetchAdmissions = async () => {
    const querySnapshot = await getDocs(collection(db, 'admissions'));
    const admissionsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAdmissions(admissionsList);
  };

  const fetchReports = async () => {
    const querySnapshot = await getDocs(collection(db, 'reports'));
    const reportsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setReports(reportsList);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'active' ? 'suspended' : 'active'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const toggleInstitutionStatus = async (institutionId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'institutions', institutionId), {
        status: currentStatus === 'active' ? 'suspended' : 'active'
      });
      fetchInstitutions();
    } catch (error) {
      console.error('Error updating institution status:', error);
    }
  };

  const toggleCompanyStatus = async (companyId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'companies', companyId), {
        status: currentStatus === 'active' ? 'suspended' : 'active'
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  const addInstitution = async (institutionData) => {
    try {
      await addDoc(collection(db, 'institutions'), {
        ...institutionData,
        createdAt: new Date(),
        status: 'active'
      });
      fetchInstitutions();
    } catch (error) {
      console.error('Error adding institution:', error);
      throw error;
    }
  };

  const updateInstitution = async (institutionId, institutionData) => {
    try {
      await updateDoc(doc(db, 'institutions', institutionId), institutionData);
      fetchInstitutions();
    } catch (error) {
      console.error('Error updating institution:', error);
      throw error;
    }
  };

  const deleteInstitution = async (institutionId) => {
    try {
      await deleteDoc(doc(db, 'institutions', institutionId));
      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting institution:', error);
      throw error;
    }
  };

  const addFaculty = async (facultyData) => {
    try {
      await addDoc(collection(db, 'faculties'), {
        ...facultyData,
        createdAt: new Date(),
        status: 'active'
      });
      fetchFaculties();
    } catch (error) {
      console.error('Error adding faculty:', error);
      throw error;
    }
  };

  const updateFaculty = async (facultyId, facultyData) => {
    try {
      await updateDoc(doc(db, 'faculties', facultyId), facultyData);
      fetchFaculties();
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  };

  const deleteFaculty = async (facultyId) => {
    try {
      await deleteDoc(doc(db, 'faculties', facultyId));
      fetchFaculties();
    } catch (error) {
      console.error('Error deleting faculty:', error);
      throw error;
    }
  };

  const addCourse = async (courseData) => {
    try {
      await addDoc(collection(db, 'courses'), {
        ...courseData,
        createdAt: new Date(),
        status: 'active'
      });
      fetchCourses();
    } catch (error) {
      console.error('Error adding course:', error);
      throw error;
    }
  };

  const updateCourse = async (courseId, courseData) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), courseData);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  };

  const publishAdmission = async (admissionData) => {
    try {
      await addDoc(collection(db, 'admissions'), {
        ...admissionData,
        createdAt: new Date(),
        status: 'published',
        publishedBy: userData.name || user.email
      });
      fetchAdmissions();
    } catch (error) {
      console.error('Error publishing admission:', error);
      throw error;
    }
  };

  const updateAdmission = async (admissionId, admissionData) => {
    try {
      await updateDoc(doc(db, 'admissions', admissionId), admissionData);
      fetchAdmissions();
    } catch (error) {
      console.error('Error updating admission:', error);
      throw error;
    }
  };

  const deleteAdmission = async (admissionId) => {
    try {
      await deleteDoc(doc(db, 'admissions', admissionId));
      fetchAdmissions();
    } catch (error) {
      console.error('Error deleting admission:', error);
      throw error;
    }
  };

  const deleteCompany = async (companyId) => {
    try {
      await deleteDoc(doc(db, 'companies', companyId));
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview institutions={institutions} companies={companies} users={users} admissions={admissions} />;
      case 'institutions':
        return <ManageInstitutions 
          institutions={institutions} 
          onToggleStatus={toggleInstitutionStatus}
          onAddInstitution={addInstitution}
          onUpdateInstitution={updateInstitution}
          onDeleteInstitution={deleteInstitution}
        />;
      case 'faculties-courses':
        return <ManageFacultiesCourses 
          faculties={faculties}
          courses={courses}
          institutions={institutions}
          onAddFaculty={addFaculty}
          onUpdateFaculty={updateFaculty}
          onDeleteFaculty={deleteFaculty}
          onAddCourse={addCourse}
          onUpdateCourse={updateCourse}
          onDeleteCourse={deleteCourse}
        />;
      case 'admissions':
        return <ManageAdmissions 
          admissions={admissions}
          institutions={institutions}
          onPublishAdmission={publishAdmission}
          onUpdateAdmission={updateAdmission}
          onDeleteAdmission={deleteAdmission}
        />;
      case 'companies':
        return <ManageCompanies 
          companies={companies} 
          onToggleStatus={toggleCompanyStatus}
          onDeleteCompany={deleteCompany}
        />;
      case 'users':
        return <ManageUsers 
          users={users} 
          onToggleStatus={toggleUserStatus} 
        />;
      case 'reports':
        return <ManageReports reports={reports} />;
      default:
        return <AdminOverview institutions={institutions} companies={companies} users={users} admissions={admissions} />;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {userData?.name || user?.email}</p>
        <p>Role: <span className="user-role">{userData?.role}</span></p>
      </div>

      <nav className="admin-navbar">
        <button 
          className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'institutions' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('institutions')}
        >
          Institutions
        </button>
        <button 
          className={activeTab === 'faculties-courses' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('faculties-courses')}
        >
          Faculties & Courses
        </button>
        <button 
          className={activeTab === 'admissions' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('admissions')}
        >
          Admissions
        </button>
        <button 
          className={activeTab === 'companies' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('companies')}
        >
          Companies
        </button>
        <button 
          className={activeTab === 'users' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'reports' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </nav>

      <main className="admin-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

// Enhanced Overview Component
const AdminOverview = ({ institutions, companies, users, admissions }) => {
  const stats = {
    totalInstitutions: institutions.length,
    activeInstitutions: institutions.filter(inst => inst.status === 'active').length,
    totalCompanies: companies.length,
    activeCompanies: companies.filter(comp => comp.status === 'active').length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status !== 'suspended').length,
    students: users.filter(u => u.role === 'student').length,
    institutions: users.filter(u => u.role === 'institution').length,
    companies: users.filter(u => u.role === 'company').length,
    publishedAdmissions: admissions.filter(adm => adm.status === 'published').length,
    totalAdmissions: admissions.length,
  };

  return (
    <div className="admin-overview">
      <h2>System Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Institutions</h3>
          <p className="stat-number">{stats.totalInstitutions}</p>
          <small>Active: {stats.activeInstitutions}</small>
        </div>
        
        <div className="stat-card">
          <h3>Total Companies</h3>
          <p className="stat-number">{stats.totalCompanies}</p>
          <small>Active: {stats.activeCompanies}</small>
        </div>
        
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
          <small>Active: {stats.activeUsers}</small>
        </div>
        
        <div className="stat-card">
          <h3>Admissions</h3>
          <p className="stat-number">{stats.totalAdmissions}</p>
          <small>Published: {stats.publishedAdmissions}</small>
        </div>
        
        <div className="stat-card">
          <h3>User Distribution</h3>
          <div className="user-distribution">
            <div>Students: {stats.students}</div>
            <div>Institutions: {stats.institutions}</div>
            <div>Companies: {stats.companies}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Institutions Management
const ManageInstitutions = ({ institutions, onToggleStatus, onAddInstitution, onUpdateInstitution, onDeleteInstitution }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInstitution) {
        await onUpdateInstitution(editingInstitution.id, formData);
      } else {
        await onAddInstitution(formData);
      }
      setShowForm(false);
      setEditingInstitution(null);
      setFormData({ name: '', email: '', phone: '', address: '', website: '' });
    } catch (error) {
      alert('Error saving institution: ' + error.message);
    }
  };

  const handleEdit = (institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      email: institution.email,
      phone: institution.phone || '',
      address: institution.address || '',
      website: institution.website || ''
    });
    setShowForm(true);
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Institutions</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Institution
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingInstitution ? 'Edit Institution' : 'Add New Institution'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address:</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Website:</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingInstitution ? 'Update' : 'Add'} Institution
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInstitution(null);
                    setFormData({ name: '', email: '', phone: '', address: '', website: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map(institution => (
              <tr key={institution.id}>
                <td>{institution.name}</td>
                <td>{institution.email}</td>
                <td>{institution.phone || 'N/A'}</td>
                <td>
                  <span className={`status status-${institution.status || 'active'}`}>
                    {institution.status || 'active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onToggleStatus(institution.id, institution.status || 'active')}
                      className={institution.status === 'suspended' ? 'btn-success' : 'btn-warning'}
                    >
                      {institution.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    <button 
                      onClick={() => handleEdit(institution)}
                      className="btn-info"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this institution?')) {
                          onDeleteInstitution(institution.id);
                        }
                      }}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {institutions.length === 0 && (
          <div className="empty-state">No institutions found</div>
        )}
      </div>
    </div>
  );
};

// Faculties and Courses Management
const ManageFacultiesCourses = ({ 
  faculties, 
  courses, 
  institutions, 
  onAddFaculty, 
  onUpdateFaculty, 
  onDeleteFaculty, 
  onAddCourse, 
  onUpdateCourse, 
  onDeleteCourse 
}) => {
  const [activeSection, setActiveSection] = useState('faculties');
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [facultyFormData, setFacultyFormData] = useState({
    name: '',
    description: '',
    institutionId: ''
  });
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    duration: '',
    facultyId: '',
    description: ''
  });

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await onUpdateFaculty(editingFaculty.id, facultyFormData);
      } else {
        await onAddFaculty(facultyFormData);
      }
      setShowFacultyForm(false);
      setEditingFaculty(null);
      setFacultyFormData({ name: '', description: '', institutionId: '' });
    } catch (error) {
      alert('Error saving faculty: ' + error.message);
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await onUpdateCourse(editingCourse.id, courseFormData);
      } else {
        await onAddCourse(courseFormData);
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseFormData({ name: '', code: '', duration: '', facultyId: '', description: '' });
    } catch (error) {
      alert('Error saving course: ' + error.message);
    }
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Faculties & Courses</h2>
        <div className="section-tabs">
          <button 
            className={activeSection === 'faculties' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('faculties')}
          >
            Faculties
          </button>
          <button 
            className={activeSection === 'courses' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('courses')}
          >
            Courses
          </button>
        </div>
        {activeSection === 'faculties' ? (
          <button className="btn-primary" onClick={() => setShowFacultyForm(true)}>
            Add Faculty
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setShowCourseForm(true)}>
            Add Course
          </button>
        )}
      </div>

      {/* Faculty Form */}
      {showFacultyForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
            <form onSubmit={handleFacultySubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={facultyFormData.name}
                  onChange={(e) => setFacultyFormData({...facultyFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Institution:</label>
                <select
                  value={facultyFormData.institutionId}
                  onChange={(e) => setFacultyFormData({...facultyFormData, institutionId: e.target.value})}
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={facultyFormData.description}
                  onChange={(e) => setFacultyFormData({...facultyFormData, description: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingFaculty ? 'Update' : 'Add'} Faculty
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowFacultyForm(false);
                    setEditingFaculty(null);
                    setFacultyFormData({ name: '', description: '', institutionId: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Form */}
      {showCourseForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
            <form onSubmit={handleCourseSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData({...courseFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Code:</label>
                <input
                  type="text"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData({...courseFormData, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (years):</label>
                <input
                  type="number"
                  value={courseFormData.duration}
                  onChange={(e) => setCourseFormData({...courseFormData, duration: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Faculty:</label>
                <select
                  value={courseFormData.facultyId}
                  onChange={(e) => setCourseFormData({...courseFormData, facultyId: e.target.value})}
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingCourse ? 'Update' : 'Add'} Course
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                    setCourseFormData({ name: '', code: '', duration: '', facultyId: '', description: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculties Table */}
      {activeSection === 'faculties' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Institution</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map(faculty => {
                const institution = institutions.find(inst => inst.id === faculty.institutionId);
                return (
                  <tr key={faculty.id}>
                    <td>{faculty.name}</td>
                    <td>{institution?.name || 'N/A'}</td>
                    <td>{faculty.description || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => {
                            setEditingFaculty(faculty);
                            setFacultyFormData({
                              name: faculty.name,
                              description: faculty.description || '',
                              institutionId: faculty.institutionId
                            });
                            setShowFacultyForm(true);
                          }}
                          className="btn-info"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this faculty?')) {
                              onDeleteFaculty(faculty.id);
                            }
                          }}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {faculties.length === 0 && (
            <div className="empty-state">No faculties found</div>
          )}
        </div>
      )}

      {/* Courses Table */}
      {activeSection === 'courses' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th>Faculty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => {
                const faculty = faculties.find(fac => fac.id === course.facultyId);
                return (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{course.code}</td>
                    <td>{course.duration} years</td>
                    <td>{faculty?.name || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => {
                            setEditingCourse(course);
                            setCourseFormData({
                              name: course.name,
                              code: course.code,
                              duration: course.duration,
                              facultyId: course.facultyId,
                              description: course.description || ''
                            });
                            setShowCourseForm(true);
                          }}
                          className="btn-info"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this course?')) {
                              onDeleteCourse(course.id);
                            }
                          }}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {courses.length === 0 && (
            <div className="empty-state">No courses found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Admissions Management
const ManageAdmissions = ({ admissions, institutions, onPublishAdmission, onUpdateAdmission, onDeleteAdmission }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    institutionId: '',
    description: '',
    requirements: '',
    deadline: '',
    startDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmission) {
        await onUpdateAdmission(editingAdmission.id, formData);
      } else {
        await onPublishAdmission(formData);
      }
      setShowForm(false);
      setEditingAdmission(null);
      setFormData({ title: '', institutionId: '', description: '', requirements: '', deadline: '', startDate: '' });
    } catch (error) {
      alert('Error saving admission: ' + error.message);
    }
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <h2>Manage Admissions</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Publish Admission
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h3>{editingAdmission ? 'Edit Admission' : 'Publish New Admission'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Institution:</label>
                <select
                  value={formData.institutionId}
                  onChange={(e) => setFormData({...formData, institutionId: e.target.value})}
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Requirements:</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Application Deadline:</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingAdmission ? 'Update' : 'Publish'} Admission
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAdmission(null);
                    setFormData({ title: '', institutionId: '', description: '', requirements: '', deadline: '', startDate: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Institution</th>
              <th>Deadline</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map(admission => {
              const institution = institutions.find(inst => inst.id === admission.institutionId);
              return (
                <tr key={admission.id}>
                  <td>{admission.title}</td>
                  <td>{institution?.name || 'N/A'}</td>
                  <td>{admission.deadline}</td>
                  <td>{admission.startDate}</td>
                  <td>
                    <span className={`status status-${admission.status || 'draft'}`}>
                      {admission.status || 'draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => {
                          setEditingAdmission(admission);
                          setFormData({
                            title: admission.title,
                            institutionId: admission.institutionId,
                            description: admission.description,
                            requirements: admission.requirements,
                            deadline: admission.deadline,
                            startDate: admission.startDate
                          });
                          setShowForm(true);
                        }}
                        className="btn-info"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this admission?')) {
                            onDeleteAdmission(admission.id);
                          }
                        }}
                        className="btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {admissions.length === 0 && (
          <div className="empty-state">No admissions found</div>
        )}
      </div>
    </div>
  );
};

// Enhanced Companies Management
const ManageCompanies = ({ companies, onToggleStatus, onDeleteCompany }) => {
  return (
    <div className="manage-section">
      <h2>Manage Companies</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.email}</td>
                <td>{company.industry || 'N/A'}</td>
                <td>
                  <span className={`status status-${company.status || 'active'}`}>
                    {company.status || 'active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onToggleStatus(company.id, company.status || 'active')}
                      className={company.status === 'suspended' ? 'btn-success' : 'btn-warning'}
                    >
                      {company.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this company?')) {
                          onDeleteCompany(company.id);
                        }
                      }}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && (
          <div className="empty-state">No companies found</div>
        )}
      </div>
    </div>
  );
};

// Enhanced Users Management
const ManageUsers = ({ users, onToggleStatus }) => {
  return (
    <div className="manage-section">
      <h2>Manage Users</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <span className="user-role-badge">{user.role}</span>
                </td>
                <td>
                  <span className={`status status-${user.status || 'active'}`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => onToggleStatus(user.id, user.status || 'active')}
                    className={user.status === 'suspended' ? 'btn-success' : 'btn-warning'}
                  >
                    {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="empty-state">No users found</div>
        )}
      </div>
    </div>
  );
};

// Reports Management
const ManageReports = ({ reports }) => {
  return (
    <div className="manage-section">
      <h2>System Reports</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Report Type</th>
              <th>Generated Date</th>
              <th>Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td>{report.type}</td>
                <td>{report.generatedDate}</td>
                <td>{report.period}</td>
                <td>
                  <span className={`status status-${report.status}`}>
                    {report.status}
                  </span>
                </td>
                <td>
                  <button className="btn-primary">
                    View
                  </button>
                  <button className="btn-info">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && (
          <div className="empty-state">No reports available</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;