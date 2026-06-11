import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AgencySpace from './pages/AgencySpace';
import PropertyDetail from './pages/PropertyDetail';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Charger la session de l'utilisateur au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('yplaza_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('yplaza_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('yplaza_user');
    setUser(null);
    setCurrentPage('home');
  };

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
    duration: 0.5
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

      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        onLogout={handleLogout} 
      />
      
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
              <Home 
                setCurrentPage={setCurrentPage} 
                onPropertyClick={(prop) => {
                  setSelectedProperty(prop);
                  setCurrentPage('property-detail');
                }}
              />
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
          {currentPage === 'login' && (
            <motion.div
              key="login"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Login setUser={setUser} setCurrentPage={setCurrentPage} />
            </motion.div>
          )}
          {currentPage === 'agency' && (
            <motion.div
              key="agency"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AgencySpace user={user} />
            </motion.div>
          )}
          {currentPage === 'property-detail' && selectedProperty && (
            <motion.div
              key="property-detail"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <PropertyDetail 
                property={selectedProperty} 
                setCurrentPage={setCurrentPage} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;

