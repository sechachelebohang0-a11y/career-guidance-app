import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const { login, signup, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name.trim()) return 'Name is required';
    if (!nameRegex.test(name)) return 'Name can only contain letters and spaces';
    if (name.length < 2) return 'Name must be at least 2 characters long';
    if (name.length > 50) return 'Name cannot exceed 50 characters';
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address (only letters, numbers, ., and @ allowed)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (isSignUp && password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };

  const validateForm = () => {
    const errors = {};

    if (isSignUp) {
      const nameError = validateName(name);
      if (nameError) errors.name = nameError;
    }

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the form errors below');
      return;
    }

    setLoading(true);

    let result;
    try {
      if (isSignUp) {
        // Sign up new user
        result = await signup(email, password, role, name.trim());
        
        if (result.success) {
          setSuccessMessage(result.message);
          setShowVerificationMessage(true);
          // Clear form
          setEmail('');
          setPassword('');
          setName('');
        } else {
          setError(result.error);
        }
      } else {
        // Log in existing user
        result = await login(email, password);
        
        if (result.success) {
          // Get the actual user role from the returned userData
          const userRole = result.userData?.role || 'student';
          const redirectPath = location.state?.from?.pathname || `/${userRole}`;
          
          setSuccessMessage('Login successful! Redirecting...');
          console.log('✅ Login successful, user role:', userRole, 'redirecting to:', redirectPath);
          
          // Add a small delay to ensure state is fully updated
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 1000);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
      } else {
        setError(result.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
      console.error('Resend verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value) => {
    // Only allow letters and spaces
    const cleanedValue = value.replace(/[^A-Za-z\s]/g, '');
    setName(cleanedValue);
    
    // Clear error when user starts typing
    if (fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleEmailChange = (value) => {
    // Allow only letters, numbers, ., @, +, -, and _
    const cleanedValue = value.replace(/[^A-Za-z0-9.@_%+-]/g, '');
    setEmail(cleanedValue);
    
    // Clear error when user starts typing
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    
    // Clear error when user starts typing
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleRoleChange = (value) => {
    setRole(value);
  };

  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    // Clear all errors and fields when toggling
    setError('');
    setSuccessMessage('');
    setFieldErrors({});
    setShowVerificationMessage(false);
    if (!isSignUp) {
      // When switching to signup, clear name field and set default role
      setName('');
      setRole('student');
    }
  };

  // Helper function to render error message
  const renderError = (fieldName) => {
    return fieldErrors[fieldName] ? (
      <div style={{ 
        color: '#dc3545', 
        fontSize: '14px', 
        marginTop: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span style={{ fontSize: '16px' }}>⚠</span>
        {fieldErrors[fieldName]}
      </div>
    ) : null;
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px',
    border: `2px solid ${hasError ? '#dc3545' : '#e1e5e9'}`,
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    backgroundColor: hasError ? '#fff5f5' : 'white',
    transition: 'border-color 0.3s ease',
    fontFamily: 'inherit'
  });

  const buttonStyle = (isPrimary = true, isDisabled = false) => ({
    width: '100%',
    padding: '12px',
    backgroundColor: isDisabled 
      ? '#95a5a6' 
      : isPrimary 
        ? '#3498db' 
        : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    opacity: isDisabled ? 0.7 : 1,
    fontFamily: 'inherit'
  });

  // Show verification success message
  if (showVerificationMessage) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
          border: '1px solid #e1e5e9'
        }}>
          <div style={{ 
            fontSize: '64px', 
            color: '#28a745',
            marginBottom: '20px'
          }}>
            ✉️
          </div>
          
          <h2 style={{ 
            color: '#28a745', 
            marginBottom: '20px',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>
            Verify Your Email Address
          </h2>
          
          <p style={{ 
            marginBottom: '20px', 
            lineHeight: '1.6',
            color: '#555',
            fontSize: '16px'
          }}>
            We've sent a verification email to <strong style={{color: '#2c3e50'}}>{email}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <p style={{ 
            marginBottom: '30px', 
            lineHeight: '1.6',
            color: '#666',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            <strong>Important:</strong> You must verify your email before you can log in to your account.
            If you don't see the email, check your spam folder.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <button
              onClick={handleResendVerification}
              disabled={loading}
              style={buttonStyle(true, loading)}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            <button
              onClick={handleToggleSignUp}
              disabled={loading}
              style={{
                ...buttonStyle(false, loading),
                backgroundColor: 'transparent',
                color: '#3498db',
                border: '2px solid #3498db'
              }}
            >
              Back to Login
            </button>
          </div>
          
          {successMessage && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px solid #c3e6cb',
              fontSize: '14px'
            }}>
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px solid #f5c6cb',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid #e1e5e9'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            color: '#2c3e50',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ 
            color: '#7f8c8d', 
            margin: 0,
            fontSize: '14px'
          }}>
            {isSignUp ? 'Join our career guidance platform' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #f5c6cb',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #c3e6cb',
            fontSize: '14px'
          }}>
            ✅ {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontSize: '14px'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required={isSignUp}
                  style={inputStyle(fieldErrors.name)}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {renderError('name')}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontSize: '14px'
                }}>
                  I am a
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="student">Student</option>
                  <option value="institution">Institution</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              style={inputStyle(fieldErrors.email)}
              placeholder="your.email@example.com"
              maxLength={100}
            />
            {renderError('email')}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#2c3e50',
              fontSize: '14px'
            }}>
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              style={inputStyle(fieldErrors.password)}
              placeholder="Enter your password"
              minLength={isSignUp ? 6 : 1}
            />
            {isSignUp && (
              <p style={{ 
                fontSize: '12px', 
                color: '#7f8c8d', 
                marginTop: '6px',
                marginBottom: '0'
              }}>
                Password must be at least 6 characters long
              </p>
            )}
            {renderError('password')}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle(true, loading)}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '1px solid #e1e5e9'
        }}>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0 0 15px 0',
            fontSize: '14px'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={handleToggleSignUp}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {isSignUp ? 'Sign in to your account' : 'Create new account'}
          </button>
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e1e5e9'
        }}>
          <p style={{ 
            margin: '0', 
            color: '#7f8c8d', 
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            <strong>Note:</strong> {isSignUp 
              ? 'After signing up, check your email for verification link.' 
              : 'The system will automatically detect your account type and redirect you to the appropriate dashboard.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;