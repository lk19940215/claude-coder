import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorks from '../components/home/HowItWorks';
import CTASection from '../components/home/CTASection';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen hero-bg">
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
    </div>
  );
};

export default Home;
