import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/league-selection');
    }
  }, [isAuthenticated, navigate]);

  // Password strength checker
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    if (strength <= 2) return { text: 'Weak', color: 'var(--error)' };
    if (strength <= 4) return { text: 'Medium', color: 'var(--warning)' };
    return { text: 'Strong', color: 'var(--success)' };
  };

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await register(formData.email, formData.password, formData.confirmPassword);
      
      if (result.success) {
        navigate('/login', { 
          state: { message: result.message } 
        });
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Join Fantasy Rugby</h2>
        </div>

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
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--black)' }}>
                    Password strength:
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    color: strengthInfo.color
                  }}>
                    {strengthInfo.text}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.25rem',
                  marginBottom: '0.5rem'
                }}>
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      style={{
                        height: '4px',
                        flex: 1,
                        backgroundColor: level <= passwordStrength ? strengthInfo.color : 'var(--light-gray)',
                        borderRadius: '2px',
                        transition: 'background-color 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            {errors.confirmPassword && (
              <div className="form-error">{errors.confirmPassword}</div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--black)' }}>
              Password Requirements:
            </h4>
            <ul style={{ 
              fontSize: '0.875rem', 
              color: 'var(--dark-gray)',
              paddingLeft: '1.5rem',
              lineHeight: '1.5'
            }}>
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Special characters recommended</li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--black)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-orange)', textDecoration: 'none' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
