import HeroSection from '../components/HeroSection';
import Features from '../components/Features';
import PropertyList from '../components/PropertyList';

export default function Home({ setCurrentPage }) {
  return (
    <div className="home-page animate-fade-in">
      <HeroSection setCurrentPage={setCurrentPage} />
      <Features />
      <PropertyList />
    </div>
  );
}
