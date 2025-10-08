import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/league-selection');
    }
  }, [isAuthenticated, navigate]);

  // Check for account lockout
  useEffect(() => {
    const lockoutData = localStorage.getItem('login_lockout');
    if (lockoutData) {
      const { attempts, timestamp } = JSON.parse(lockoutData);
      const now = Date.now();
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes

      if (now - timestamp < lockoutDuration) {
        setIsLocked(true);
        setLoginAttempts(attempts);
        setLockoutTime(new Date(timestamp + lockoutDuration));
      } else {
        localStorage.removeItem('login_lockout');
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }
    
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.requestPasswordReset(resetEmail);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setResetError('An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      setErrors({ general: 'Account is temporarily locked due to too many failed attempts. Please try again later.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Reset login attempts on successful login
        localStorage.removeItem('login_lockout');
        setLoginAttempts(0);
        navigate('/league-selection');
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
          // Lock account for 15 minutes
          const lockoutData = {
            attempts: newAttempts,
            timestamp: Date.now()
          };
          localStorage.setItem('login_lockout', JSON.stringify(lockoutData));
          setIsLocked(true);
          setLockoutTime(new Date(Date.now() + 15 * 60 * 1000));
          setErrors({ general: 'Too many failed attempts. Account locked for 15 minutes.' });
        } else {
          setErrors({ general: result.error || 'Invalid email or password' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRemainingTime = () => {
    if (!lockoutTime) return '';
    const now = new Date();
    const remaining = Math.ceil((lockoutTime - now) / 1000 / 60);
    return remaining > 0 ? `${remaining} minutes` : '';
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Login to Fantasy Rugby</h2>
        </div>

        {isLocked && (
          <div className="alert alert-error">
            Account locked due to too many failed attempts. 
            Try again in {getRemainingTime()}.
          </div>
        )}

        {errors.general && (
          <div className="alert alert-error">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={isLocked}
              autoComplete="email"
              required
            />
            {errors.email && (
              <div className="form-error">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={isLocked}
              autoComplete="current-password"
              required
            />
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setResetEmail(formData.email);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-orange)',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting || isLocked}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--black)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-orange)', textDecoration: 'none' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {!resetEmailSent ? (
              <>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--databricks-blue)' }}>
                  🔒 Reset Your Password
                </h3>
                
                <p style={{ margin: '0 0 1.5rem 0', lineHeight: '1.5', color: 'var(--dark-gray)' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {resetError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="form-input"
                      placeholder="your@email.com"
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                        setResetError('');
                        setResetEmailSent(false);
                      }}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--databricks-blue)' }}>
                  ✅ Check Your Email
                </h3>
                
                <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                  If an account exists with <strong>{resetEmail}</strong>, we've sent a password reset link to that address.
                </p>

                <p style={{ margin: '0 0 1.5rem 0', lineHeight: '1.5', fontSize: '14px', color: 'var(--dark-gray)' }}>
                  Please check your email and click the reset link. The link will expire in 1 hour.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setResetEmailSent(false);
                    }}
                    className="btn btn-primary"
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
