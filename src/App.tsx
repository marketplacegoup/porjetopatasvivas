import { useState, useEffect } from 'react';
import { CampaignPage } from './components/CampaignPage';
import { DonationModal } from './components/DonationModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ExitIntentModal } from './components/ExitIntentModal';
import { ConfigPage } from './components/ConfigPage';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [selectedAmount, setSelectedAmount] = useState<number>(10000); // Default R$ 100
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutAmount, setCheckoutAmount] = useState<number>(10000);
  const [currentPage, setCurrentPage] = useState<'campaign' | 'config'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#config') {
      return 'config';
    }
    return 'campaign';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#config') {
        setCurrentPage('config');
      } else {
        setCurrentPage('campaign');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: 'campaign' | 'config') => {
    setCurrentPage(page);
    if (page === 'config') {
      window.location.hash = '#config';
    } else {
      window.location.hash = '';
    }
  };

  const handleOpenDonation = (cents?: any) => {
    if (typeof cents === 'number' && !isNaN(cents) && cents > 0) {
      setSelectedAmount(cents);
    }
    setIsDonationModalOpen(true);
  };

  const handleProceedToPayment = (cents?: any) => {
    const validCents = typeof cents === 'number' && !isNaN(cents) && cents > 0 ? cents : selectedAmount;
    setCheckoutAmount(validCents);
    setIsDonationModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="relative min-h-screen">
      {/* Botão de retorno quando na página de configurações */}
      {currentPage === 'config' && (
        <div className="fixed right-3 top-3 z-50">
          <button
            type="button"
            id="back-to-campaign-btn"
            onClick={() => navigateTo('campaign')}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-md transition-all hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar à Campanha
          </button>
        </div>
      )}

      {currentPage === 'config' ? (
        <ConfigPage onBackToCampaign={() => navigateTo('campaign')} />
      ) : (
        <>
          {/* Campaign Page */}
          <CampaignPage
            selectedAmount={selectedAmount}
            onSelectAmount={setSelectedAmount}
            onOpenDonationModal={handleOpenDonation}
            onQueroAjudar={(cents) => {
              const validCents = typeof cents === 'number' && !isNaN(cents) && cents > 0 ? cents : selectedAmount;
              handleProceedToPayment(validCents);
            }}
            onOpenConfig={() => navigateTo('config')}
          />

          {/* Donation Selection Modal */}
          <DonationModal
            isOpen={isDonationModalOpen}
            selectedAmount={selectedAmount}
            onSelectAmount={setSelectedAmount}
            onClose={() => setIsDonationModalOpen(false)}
            onProceedToPayment={handleProceedToPayment}
          />

          {/* PIX checkout modal */}
          <CheckoutModal
            cents={checkoutAmount}
            isOpen={isCheckoutModalOpen}
            onClose={() => setIsCheckoutModalOpen(false)}
          />

          {/* Exit Intent Modal */}
          <ExitIntentModal
            onOpenDonation={() => {
              const el = document.getElementById('grid-donate-btn') || document.getElementById('doar');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-brand', 'scale-105');
                setTimeout(() => {
                  el.classList.remove('ring-4', 'ring-brand', 'scale-105');
                }, 1200);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
