import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 20
    },
    in: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    out: {
      opacity: 0,
      scale: 1.02,
      y: -20
    }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.6
  };

  return (
    <div className="app-container">
      {/* Global Background Video */}
      <div className={`global-video-bg ${currentPage !== 'home' ? 'blurred' : ''}`}>
        <video autoPlay loop muted playsInline>
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Home setCurrentPage={setCurrentPage} />
            </motion.div>
          )}
          {currentPage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;
