import React, { useState, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TorusWalletAdapter } from '@solana/wallet-adapter-torus';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import Sidebar from '@/react-app/components/Sidebar';
import ErrorBoundary from '@/react-app/components/ErrorBoundary';
import { GameLoader } from '@/react-app/components/LoadingSpinner';
import Lobby from "@/react-app/pages/Lobby";
import AuthCallback from "@/react-app/pages/AuthCallback";
import CreateAccount from "@/react-app/pages/CreateAccount";
import { SolanaProvider } from "@/react-app/providers/SolanaProvider";
import { AccessibilityProvider, SkipToContent } from '@/react-app/components/AccessibilityProvider';
import { GlobalErrorBoundary } from '@/react-app/utils/errorBoundary';

// Lazy load games for better performance
const SportsPage = lazy(() => import("@/react-app/pages/SportsPage"));
const DiceGame = lazy(() => import("@/react-app/pages/DiceGameNew"));
const CrashGame = lazy(() => import("@/react-app/pages/CrashGame"));
const MinesGame = lazy(() => import("@/react-app/pages/MinesGame"));
const PlinkoGame = lazy(() => import("@/react-app/pages/PlinkoGame"));
const SlotsGame = lazy(() => import("@/react-app/pages/SlotsGame"));
const RouletteGame = lazy(() => import("@/react-app/pages/RouletteGame"));
const BlackjackGame = lazy(() => import("@/react-app/pages/BlackjackGame"));
const PokerGame = lazy(() => import("@/react-app/pages/PokerGame"));
const BaccaratGame = lazy(() => import("@/react-app/pages/BaccaratGame"));
const KenoGame = lazy(() => import("@/react-app/pages/KenoGame"));
const HiLoGame = lazy(() => import("@/react-app/pages/HiLoGame"));
const WheelOfFortuneGame = lazy(() => import("@/react-app/pages/WheelOfFortuneGame"));
const SicBoGame = lazy(() => import("@/react-app/pages/SicBoGame"));
const AndarBaharGame = lazy(() => import("@/react-app/pages/AndarBaharGame"));
const AviatorGame = lazy(() => import("@/react-app/pages/AviatorGame"));
const DiceDuelGame = lazy(() => import("@/react-app/pages/DiceDuelGame"));
const Lucky7sGame = lazy(() => import("@/react-app/pages/Lucky7sGame"));
const RockPaperScissorsGame = lazy(() => import("@/react-app/pages/RockPaperScissorsGame"));
const CrossroadsGame = lazy(() => import("@/react-app/pages/CrossroadsGame"));
const CoinFlipGame = lazy(() => import("@/react-app/pages/CoinFlipGame"));
const ScratchOffGame = lazy(() => import("@/react-app/pages/ScratchOffGame"));
const GameTestPanel = lazy(() => import('@/react-app/components/GameTestPanel'));
const FrontendDebugPanel = lazy(() => import('@/react-app/components/FrontendDebugPanel'));

// Lazy load footer pages
const Privacy = lazy(() => import("@/react-app/pages/Privacy"));
const Terms = lazy(() => import("@/react-app/pages/Terms"));
const ResponsibleGaming = lazy(() => import("@/react-app/pages/ResponsibleGaming"));
const Fairness = lazy(() => import("@/react-app/pages/Fairness"));
const Help = lazy(() => import("@/react-app/pages/Help"));
const Contact = lazy(() => import("@/react-app/pages/Contact"));
const FAQ = lazy(() => import("@/react-app/pages/FAQ"));
const Guides = lazy(() => import("@/react-app/pages/Guides"));
const Community = lazy(() => import("@/react-app/pages/Community"));
const Affiliate = lazy(() => import("@/react-app/pages/Affiliate"));
const About = lazy(() => import("@/react-app/pages/About"));
const DepositGuide = lazy(() => import("@/react-app/pages/DepositGuide"));
const AdminDashboard = lazy(() => import("@/react-app/pages/AdminDashboard"));
const WalletPage = lazy(() => import("@/react-app/pages/WalletPage"));

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const App = (): React.ReactElement => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Use mainnet for production
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
  ], []);

  return (
    <GlobalErrorBoundary>
      <ErrorBoundary>
        <AccessibilityProvider>
          <AuthProvider>
            <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <SolanaProvider>
                    <Router>
                      <SkipToContent />
                      <div className="flex">
                        <Sidebar 
                          isOpen={sidebarOpen} 
                          onToggle={() => setSidebarOpen(!sidebarOpen)} 
                        />
                        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : ''}`} id="main-content">
                          <Suspense fallback={<GameLoader gameName="Loading" />}>
                            <Routes>
                              <Route path="/" element={<Lobby />} />
                              <Route path="/lobby" element={<Lobby />} />
                              <Route path="/sports" element={<SportsPage />} />
                              <Route path="/games/dice" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <DiceGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/crash" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <CrashGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/mines" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <MinesGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/plinko" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <PlinkoGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/slots" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <SlotsGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/roulette" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <RouletteGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/blackjack" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <BlackjackGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/poker" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <PokerGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/baccarat" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <BaccaratGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/keno" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <KenoGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/hilo" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <HiLoGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/wheel" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <WheelOfFortuneGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/sicbo" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <SicBoGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/andarbahar" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <AndarBaharGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/aviator" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <AviatorGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/diceduel" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <DiceDuelGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/lucky7s" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <Lucky7sGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/rockpaperscissors" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <RockPaperScissorsGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/crossroads" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <CrossroadsGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/coinflip" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <CoinFlipGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/games/scratchoff" element={
                                <ErrorBoundary fallback={<div className="p-8 text-center text-white">Game loading failed. <button onClick={() => window.location.reload()} className="text-cyan-400 underline">Try again</button></div>}>
                                  <ScratchOffGame />
                                </ErrorBoundary>
                              } />
                              <Route path="/auth/callback" element={<AuthCallback />} />
                              <Route path="/create-account" element={<CreateAccount />} />
                              <Route path="/debug" element={<GameTestPanel isVisible={true} onClose={() => {}} />} />
                              <Route path="/frontend-debug" element={<FrontendDebugPanel />} />
                              
                              {/* Footer Pages */}
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
                              <Route path="/fairness" element={<Fairness />} />
                              <Route path="/help" element={<Help />} />
                              <Route path="/contact" element={<Contact />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/guides" element={<Guides />} />
                              <Route path="/community" element={<Community />} />
                              <Route path="/affiliate" element={<Affiliate />} />
                              <Route path="/about" element={<About />} />
                              <Route path="/deposit-guide" element={<DepositGuide />} />
                              <Route path="/admin" element={<AdminDashboard />} />
                              <Route path="/wallet" element={<WalletPage />} />
                            </Routes>
                          </Suspense>
                        </div>
                      </div>
                    </Router>
                  </SolanaProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
};

export default App;
