import React, { useState } from 'react';
import { Link } from 'react-router';
import { Github, Twitter, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function FooterSection({ title, children, defaultExpanded = false }: FooterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-white/10 rounded-lg bg-gray-800/50 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-900/80 border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Brand Section - Always Visible */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CH</span>
            </div>
            <span className="text-white font-bold text-2xl">CoinHype</span>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            The most trusted Solana crypto casino with provably fair games and instant payouts.
          </p>
        </div>

        {/* Collapsible Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Games Section */}
          <FooterSection title="Popular Games" defaultExpanded={true}>
            <div className="space-y-2">
              <Link to="/games/dice" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🎲 Dice
              </Link>
              <Link to="/games/crash" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🚀 Crash
              </Link>
              <Link to="/games/mines" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                💣 Mines
              </Link>
              <Link to="/games/plinko" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🏀 Plinko
              </Link>
              <Link to="/games/slots" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🍒 Slots
              </Link>
              <Link to="/games/roulette" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🎰 Roulette
              </Link>
              <Link to="/games/blackjack" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🃏 Blackjack
              </Link>
              <Link to="/games/poker" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                👑 Poker
              </Link>
            </div>
          </FooterSection>

          {/* Legal & Policy Section */}
          <FooterSection title="Legal & Policy">
            <div className="space-y-2">
              <Link to="/terms" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                📋 Terms of Service
              </Link>
              <Link to="/privacy" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🔒 Privacy Policy
              </Link>
              <Link to="/responsible-gaming" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🛡️ Responsible Gaming
              </Link>
              <Link to="/fairness" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                ⚖️ Provably Fair
              </Link>
              <a 
                href="https://solscan.io/account/3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
              >
                <span>🏦 House Wallet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </FooterSection>

          {/* Support & Help Section */}
          <FooterSection title="Support & Help">
            <div className="space-y-2">
              <Link to="/help" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                ❓ Help Center
              </Link>
              <Link to="/contact" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                📧 Contact Support
              </Link>
              <Link to="/faq" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                💬 Frequently Asked Questions
              </Link>
              <Link to="/guides" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                📚 Guides & Tutorials
              </Link>
              <Link to="/deposit-guide" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                💳 How to Deposit
              </Link>
            </div>
          </FooterSection>

          {/* Community & Social Section */}
          <FooterSection title="Community & Social">
            <div className="space-y-3">
              <a 
                href="https://twitter.com/coinhype" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://github.com/coinhype" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 text-sm transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Link to="/community" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🌟 Community Hub
              </Link>
              <Link to="/affiliate" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                🤝 Affiliate Program
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                ℹ️ About CoinHype
              </Link>
            </div>
          </FooterSection>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>© 2025 CoinHype. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span>Powered by Solana</span>
              <span className="hidden md:inline">•</span>
              <span>Provably Fair Gaming</span>
              <span className="hidden md:inline">•</span>
              <span>Licensed & Regulated</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>🎮 Gamble Responsibly</span>
              <span>•</span>
              <span>🔞 18+ Only</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
