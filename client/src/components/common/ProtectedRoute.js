import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userData, loading, authChecked, isAuthenticated } = useAuth();

  console.log('🛡️ ProtectedRoute Debug:', {
    user: user?.uid,
    userData: userData?.role,
    loading,
    authChecked,
    isAuthenticated,
    allowedRoles,
    userRole: userData?.role,
    emailVerified: user?.emailVerified
  });

  // Show loading while checking authentication
  if (loading || !authChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column'
      }}>
        <div>Checking authentication...</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {loading ? 'Loading...' : 'Checking auth state...'}
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ ProtectedRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Check if email is verified (double check)
  if (user && !user.emailVerified) {
    console.log('❌ ProtectedRoute: Email not verified');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>
          Email Verification Required
        </h2>
        <p style={{ marginBottom: '20px', fontSize: '16px', maxWidth: '500px' }}>
          Please verify your email address to access this page. Check your inbox for the verification link we sent to <strong>{user.email}</strong>.
        </p>
        <p style={{ marginBottom: '30px', fontSize: '14px', color: '#666' }}>
          After verifying, please refresh this page or try logging in again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}
        >
          I've Verified My Email - Refresh Page
        </button>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && userData?.role) {
    if (!allowedRoles.includes(userData.role)) {
      console.log('🚫 ProtectedRoute: Role mismatch', {
        userRole: userData.role,
        allowedRoles
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ ProtectedRoute: Access granted for role:', userData?.role);
  return children;
};

export default ProtectedRoute;