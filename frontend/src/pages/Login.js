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
    </div>
  );
};

export default Login;
