import { useEffect, useState } from 'react';

interface ExitIntentModalProps {
  onOpenDonation: () => void;
}

export function ExitIntentModal({ onOpenDonation }: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    if (hasDismissed) return;

    let timer: NodeJS.Timeout;
    const trigger = () => {
      if (!hasDismissed) {
        setHasDismissed(true);
        setIsOpen(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        trigger();
      }
    };

    const donateEl = document.getElementById('doar');
    let observer: IntersectionObserver | undefined;

    if (donateEl && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            clearTimeout(timer);
            timer = setTimeout(trigger, 25000);
          } else {
            clearTimeout(timer);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(donateEl);
    }

    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [hasDismissed]);

  const handleShareWhatsApp = () => {
    const text =
      'Conheça o trabalho do Patas Vivas · Cuidadores de Animais. Eles cuidam de animais resgatados, garantindo alimentação, abrigo e assistência veterinária. Compartilho para que mais pessoas possam conhecer e apoiar. 🐾❤️';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${currentUrl}`)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      id="exit-intent-modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4"
    >
      <div
        id="exit-intent-modal"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl sm:p-5"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar"
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>

        <h2 className="text-sm font-extrabold tracking-tight text-foreground sm:text-base">
          Antes de ir...
        </h2>
        <h3 className="mt-0.5 text-xs font-bold text-brand sm:text-sm">
          Talvez você possa fazer uma última coisa por eles.
        </h3>
        <div className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          <p>
            Você conheceu um pouco da história dos animais que estão sob nossos cuidados.
          </p>
          <p>
            Alguns chegaram com fome, outros machucados ou assustados. Mas todos tinham algo em comum: precisavam de alguém que não passasse sem olhar.
          </p>
          <p>
            Hoje, eles estão recebendo cuidado. E esse cuidado precisa continuar.
          </p>
          <p>
            Se puder contribuir, qualquer valor ajuda. Se não puder doar agora, tudo bem: você ainda pode fazer parte dessa corrente compartilhando esta página com quem possa ajudar.
          </p>
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          <button
            id="exit-intent-help-btn"
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenDonation();
            }}
            className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
          >
            QUERO AJUDAR
          </button>

          <button
            id="share-whatsapp-btn"
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full rounded-xl border border-brand bg-card py-2 text-xs font-bold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-brand-soft"
          >
            COMPARTILHAR NO WHATSAPP
          </button>

          <button
            id="exit-intent-dismiss-btn"
            type="button"
            onClick={() => setIsOpen(false)}
            className="pt-1 text-center text-[10px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Não posso ajudar agora
          </button>
        </div>
      </div>
    </div>
  );
}
