import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Shield, Zap, Trophy, ArrowLeft, Mail, UserIcon, Eye, EyeOff } from 'lucide-react';
import Logo from '@/react-app/components/Logo';

export default function CreateAccount() {
  const navigate = useNavigate();
  const { user, redirectToLogin, isPending } = useAuth();
  
  // Form state
  const [formMode, setFormMode] = useState<'signup' | 'signin'>('signup');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/lobby');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formMode === 'signup') {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = formMode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Redirect to lobby after successful authentication
        navigate('/lobby');
      } else {
        setErrors({ submit: result.error || 'Authentication failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'Your account is protected with enterprise-grade security'
    },
    {
      icon: Zap,
      title: 'Instant Access',
      description: 'Start playing immediately after account creation'
    },
    {
      icon: Trophy,
      title: 'Premium Features',
      description: 'Access exclusive games, bonuses, and VIP rewards'
    }
  ];

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="glass-panel p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white">Back to Lobby</span>
          </button>
          <Logo size="medium" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Create Account Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-white mb-4">
                {formMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                {formMode === 'signup' 
                  ? 'Create your account with username, email & password to access crypto wallet features'
                  : 'Sign in to access your wallet and continue gaming'
                }
              </p>
            </div>

            <div className="glass-panel p-8 space-y-6">
              {/* Mode Toggle */}
              <div className="flex bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setFormMode('signup')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    formMode === 'signup'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setFormMode('signin')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    formMode === 'signin'
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field (Sign Up Only) */}
                {formMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                          errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                        }`}
                        placeholder="Choose a username"
                      />
                    </div>
                    {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-4 pr-12 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                      }`}
                      placeholder={formMode === 'signup' ? 'Create a password' : 'Enter your password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                {formMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-4 pr-12 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                          errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-cyan-500'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{formMode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                    </div>
                  ) : (
                    formMode === 'signup' ? 'Create Account' : 'Sign In'
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center space-x-4">
                <hr className="flex-1 border-gray-600" />
                <span className="text-gray-400 text-sm">or</span>
                <hr className="flex-1 border-gray-600" />
              </div>

              {/* Google Sign In */}
              <motion.button
                onClick={redirectToLogin}
                className="w-full flex items-center justify-center space-x-3 py-3 px-6 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </motion.button>

              {formMode === 'signup' && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Why Choose Coin Hype?
              </h2>
              <p className="text-gray-400">
                Experience the future of crypto gaming with premium features and unmatched security
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-panel p-6 hover:scale-105 transition-transform"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-panel p-6 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border-cyan-400/30"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                  🎉 Complete Account Setup
                </h3>
                <p className="text-gray-300 mb-4">
                  After creating your account, connect your crypto wallet to play with real SOL
                </p>
                <div className="text-2xl font-bold gradient-text">
                  Username + Email + Wallet!
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
