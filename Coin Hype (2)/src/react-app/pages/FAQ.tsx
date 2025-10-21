import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqs: FAQItem[] = [
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Creating an account is simple! Click the "Sign Up" button, enter your email and choose a password, or sign in with Google for faster registration. You\'ll need to verify your email before you can start playing.'
    },
    {
      category: 'account',
      question: 'How do I connect my Solana wallet?',
      answer: 'Click the "Connect Wallet" button in the top right corner. We support Phantom, Solflare, and Torus wallets. Make sure you have a Solana wallet installed and some SOL for transactions.'
    },
    {
      category: 'deposits',
      question: 'How do I deposit SOL?',
      answer: 'After connecting your wallet, click "Deposit" and select the amount you want to deposit. Confirm the transaction in your wallet. Deposits are usually instant but may take up to 30 seconds during network congestion.'
    },
    {
      category: 'deposits',
      question: 'What are the deposit fees?',
      answer: 'CoinHype doesn\'t charge deposit fees, but you\'ll pay standard Solana network fees (usually 0.000005 SOL or less). These fees go to the Solana network, not to us.'
    },
    {
      category: 'withdrawals',
      question: 'How long do withdrawals take?',
      answer: 'Withdrawals are processed instantly once confirmed. The transaction will appear in your wallet within 30 seconds. During high network traffic, it may take up to 2 minutes.'
    },
    {
      category: 'withdrawals',
      question: 'Is there a minimum withdrawal amount?',
      answer: 'Yes, the minimum withdrawal is 0.01 SOL to ensure the transaction fees don\'t consume your entire withdrawal. There\'s no maximum withdrawal limit.'
    },
    {
      category: 'games',
      question: 'Are the games provably fair?',
      answer: 'Yes! All our games use provably fair algorithms. You can verify the fairness of any bet using our verification tool or third-party verifiers. Check our Provably Fair page for technical details.'
    },
    {
      category: 'games',
      question: 'What are the house edges?',
      answer: 'House edges vary by game: Dice (1%), Crash (1%), Mines (varies by selection), Roulette (2.7%), Blackjack (0.5%), Slots (3-5%). These are among the lowest in the industry.'
    },
    {
      category: 'technical',
      question: 'Why can\'t I connect my wallet?',
      answer: 'Make sure you have a supported wallet (Phantom, Solflare, or Torus) installed and unlocked. Try refreshing the page, clearing your browser cache, or switching to a different browser if issues persist.'
    },
    {
      category: 'technical',
      question: 'The site is loading slowly. What should I do?',
      answer: 'Try refreshing your browser, clearing cache and cookies, or switching to a different network. Our site is optimized for speed, so slow loading usually indicates a connectivity issue.'
    },
    {
      category: 'security',
      question: 'How do you protect my funds?',
      answer: 'We use industry-standard security: SSL encryption, secure wallet integration, and cold storage for house funds. We never store your private keys - they remain in your wallet at all times.'
    },
    {
      category: 'security',
      question: 'Can I play anonymously?',
      answer: 'Yes! You only need an email to create an account. We don\'t require KYC for most users. However, large withdrawals may require additional verification for security and compliance.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'account', name: 'Account' },
    { id: 'deposits', name: 'Deposits' },
    { id: 'withdrawals', name: 'Withdrawals' },
    { id: 'games', name: 'Games' },
    { id: 'technical', name: 'Technical' },
    { id: 'security', name: 'Security' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
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
            <HelpCircle className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Frequently Asked Questions</h1>
          </div>
          <p className="text-gray-400">Find quick answers to the most common questions about CoinHype.</p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredFAQs.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-gray-400">No questions found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-panel overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
                  {expandedItems.includes(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedItems.includes(index) && (
                  <div className="px-6 pb-4 border-t border-white/10">
                    <div className="pt-4">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      <div className="mt-3">
                        <span className="inline-block px-2 py-1 bg-cyan-600/20 text-cyan-400 text-xs rounded-full">
                          {categories.find(c => c.id === faq.category)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 mt-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
          <p className="text-gray-300 mb-6">
            Can't find the answer you're looking for? Our support team is here to help 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/contact')}
              className="neon-button"
            >
              Contact Support
            </button>
            <button 
              onClick={() => navigate('/help')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Help Center
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
