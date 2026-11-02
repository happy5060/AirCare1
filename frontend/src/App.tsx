import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import type { PageId } from './components/Header';
import { Footer } from './components/Footer';
import { TodaysAqi } from './pages/TodaysAqi';
import { PastAqi } from './pages/PastAqi';
import { CompareCities } from './pages/CompareCities';

const VALID_PAGES: PageId[] = ['today', 'past', 'compare'];

function getPageFromHash(): PageId {
  const hash = window.location.hash.replace('#', '') as PageId;
  return VALID_PAGES.includes(hash) ? hash : 'today';
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Persistent App Bar (AirCare Branding & 3 Main Features) */}
      <Header activePage={currentPage} onNavigate={handleNavigate} />

      {/* Main Feature View */}
      <div className="flex-1 flex flex-col">
        {currentPage === 'today' && <TodaysAqi onNavigate={handleNavigate} />}
        {currentPage === 'past' && <PastAqi onNavigate={handleNavigate} />}
        {currentPage === 'compare' && <CompareCities onNavigate={handleNavigate} />}
      </div>

      {/* Persistent Academic & Scientific Disclaimer Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
