import React, { useState, useEffect } from 'react';
import { AuthProvider } from './lib/context/AuthContext';
import { ToastProvider } from './lib/context/ToastContext';
import { TopNav } from './components/layout/TopNav';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AssistantPage } from './pages/AssistantPage';
import { InsightsPage } from './pages/InsightsPage';
import { FireRiskMapPage } from './pages/FireRiskMapPage';

// Farmer
import { MyListingsPage } from './pages/farmer/MyListingsPage';
import { CreateListingPage } from './pages/farmer/CreateListingPage';
import { ListingDetailsPage } from './pages/farmer/ListingDetailsPage';
import { FarmerMatchesPage } from './pages/farmer/FarmerMatchesPage';
import { ResidueCalculatorPage } from './pages/farmer/ResidueCalculatorPage';

// Buyer
import { MarketplacePage } from './pages/buyer/MarketplacePage';
import { BuyerRequirementsPage } from './pages/buyer/BuyerRequirementsPage';
import { CreateRequirementPage } from './pages/buyer/CreateRequirementPage';
import { BuyerMatchesPage } from './pages/buyer/BuyerMatchesPage';

// Baler
import { BalerServicesPage } from './pages/baler/BalerServicesPage';
import { BalerJobsPage } from './pages/baler/BalerJobsPage';

// Contracts & Settlements
import { QuotesPage } from './pages/contracts/QuotesPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { ContractDetailsPage } from './pages/contracts/ContractDetailsPage';
import { SettlementDetailsPage } from './pages/contracts/SettlementDetailsPage';
import { ImpactDashboardPage } from './pages/contracts/ImpactDashboardPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [queryParams, setQueryParams] = useState<URLSearchParams>(() => {
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setQueryParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    const [pathname, search] = path.split('?');
    window.history.pushState({}, '', path);
    setCurrentPath(pathname || '/');
    setQueryParams(new URLSearchParams(search || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const renderRoute = () => {
    // Exact or parameter matches
    if (currentPath === '/' || currentPath === '') {
      return <LandingPage onNavigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }
    if (currentPath === '/dashboard' || currentPath === '/baler/dashboard') {
      return <DashboardPage onNavigate={navigate} />;
    }
    if (currentPath === '/profile') {
      return <ProfilePage onNavigate={navigate} />;
    }
    if (currentPath === '/assistant') {
      return <AssistantPage onNavigate={navigate} />;
    }
    if (currentPath === '/insights') {
      return <InsightsPage onNavigate={navigate} />;
    }
    if (currentPath === '/fire-risks') {
      return <FireRiskMapPage onNavigate={navigate} />;
    }

    // Farmer Routes
    if (currentPath === '/farmer/listings') {
      return <MyListingsPage onNavigate={navigate} />;
    }
    if (currentPath === '/farmer/listings/new') {
      return <CreateListingPage onNavigate={navigate} initialParams={queryParams} />;
    }
    if (currentPath.startsWith('/farmer/listings/')) {
      const listingId = currentPath.replace('/farmer/listings/', '');
      return <ListingDetailsPage listingId={listingId} onNavigate={navigate} />;
    }
    if (currentPath === '/farmer/matches') {
      return <FarmerMatchesPage onNavigate={navigate} />;
    }
    if (currentPath === '/farmer/residue-calculator') {
      return <ResidueCalculatorPage onNavigate={navigate} />;
    }

    // Buyer Routes
    if (currentPath === '/buyer/marketplace') {
      return <MarketplacePage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/buyer/marketplace/')) {
      const listingId = currentPath.replace('/buyer/marketplace/', '');
      return <ListingDetailsPage listingId={listingId} onNavigate={navigate} />;
    }
    if (currentPath === '/buyer/requirements') {
      return <BuyerRequirementsPage onNavigate={navigate} />;
    }
    if (currentPath === '/buyer/requirements/new') {
      return <CreateRequirementPage onNavigate={navigate} />;
    }
    if (currentPath === '/buyer/matches') {
      return <BuyerMatchesPage onNavigate={navigate} />;
    }

    // Baler Routes
    if (currentPath === '/baler/profile') {
      return <BalerServicesPage onNavigate={navigate} />;
    }
    if (currentPath === '/baler/matches') {
      return <BalerJobsPage onNavigate={navigate} />;
    }

    // Contracts & Transactions Routes
    if (currentPath === '/quotes') {
      return <QuotesPage onNavigate={navigate} initialParams={queryParams} />;
    }
    if (currentPath === '/contracts') {
      return <ContractsPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/contracts/')) {
      const contractId = currentPath.replace('/contracts/', '');
      return <ContractDetailsPage contractId={contractId} onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/settlements/')) {
      const settlementId = currentPath.replace('/settlements/', '');
      return <SettlementDetailsPage settlementId={settlementId} onNavigate={navigate} />;
    }
    if (currentPath === '/impact') {
      return <ImpactDashboardPage onNavigate={navigate} />;
    }

    // Fallback: Landing Page
    return <LandingPage onNavigate={navigate} />;
  };

  const isHome = currentPath === '/' || currentPath === '';
  const heroRoutes = [
    '/dashboard',
    '/baler/dashboard',
    '/assistant',
    '/insights',
    '/fire-risks',
    '/farmer/listings',
    '/farmer/residue-calculator',
    '/buyer/marketplace',
    '/baler/matches',
    '/contracts',
    '/impact',
  ];
  const hasHeroBanner = heroRoutes.includes(currentPath);
  const OTHER_PAGES_BG = 'https://framerusercontent.com/images/qQ7rFB5eVVBjturZ7t2PLrcFLI.jpg?scale-down-to=2048';

  return (
    <AuthProvider>
      <ToastProvider>
        <div
          className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#0D1810] text-white selection:bg-[#E5A812]/20 selection:text-[#E5A812] ${
            !isHome ? 'relative bg-cover bg-top bg-fixed' : ''
          }`}
          style={
            !isHome
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(5, 12, 8, 0.4) 0%, rgba(9, 18, 12, 0.65) 25%, rgba(6, 13, 9, 0.78) 60%, rgba(4, 9, 6, 0.94) 100%), radial-gradient(ellipse at 50% 20%, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.8) 100%), url('${OTHER_PAGES_BG}')`,
                }
              : undefined
          }
        >
          {!isHome && <TopNav currentPath={currentPath} onNavigate={navigate} />}
          <main className={`flex-1 w-full max-w-full relative z-10 bg-transparent ${hasHeroBanner || isHome ? '' : 'pt-24 sm:pt-32'}`}>
            {renderRoute()}
          </main>
          <Footer onNavigate={navigate} />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
