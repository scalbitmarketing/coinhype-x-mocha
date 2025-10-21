import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, Clock, Send } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    alert('Message sent successfully! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casino</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Contact Support</h1>
          </div>
          <p className="text-gray-400">Get help from our dedicated support team. We're here 24/7.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                >
                  <option value="">Select a topic</option>
                  <option value="deposit">Deposit Issue</option>
                  <option value="withdrawal">Withdrawal Issue</option>
                  <option value="game">Game Problem</option>
                  <option value="account">Account Issue</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full neon-button flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-panel p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="w-5 h-5 text-cyan-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">Live Chat</h3>
                    <p className="text-gray-300 text-sm">Available 24/7 for instant support</p>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm mt-1 transition-colors">
                      Start Live Chat →
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">Email Support</h3>
                    <p className="text-gray-300 text-sm">support@coinhype.com</p>
                    <p className="text-gray-400 text-xs mt-1">Response within 1-4 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">Response Times</h3>
                    <p className="text-gray-300 text-sm">Live Chat: Instant</p>
                    <p className="text-gray-300 text-sm">Email: 1-4 hours</p>
                    <p className="text-gray-300 text-sm">Complex Issues: Up to 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-white mb-4">Before You Contact Us</h2>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-medium text-cyan-400 mb-2">Quick Solutions</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Check our <button onClick={() => navigate('/faq')} className="text-cyan-400 hover:underline">FAQ section</button></li>
                    <li>• Try refreshing your browser</li>
                    <li>• Clear your browser cache</li>
                    <li>• Check your internet connection</li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-medium text-orange-400 mb-2">Include This Info</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Your account email</li>
                    <li>• Transaction ID (if applicable)</li>
                    <li>• Screenshots of the issue</li>
                    <li>• Browser and device details</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
