import { useState, useEffect } from 'react';
import {
  CAUSE_ALLOCATIONS,
  DONATION_AMOUNTS,
  formatBRL,
  POPULAR_AMOUNT,
  INITIAL_ANIMALS,
} from '../data';
import { WistiaPlayer } from './WistiaPlayer';
import {
  Heart,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Activity,
  HeartHandshake,
  Share2,
  X,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  Utensils,
  Pill,
  Sparkle,
  Package,
} from 'lucide-react';
import { AnimalItem } from '../types';

export const HERO_CAROUSEL_IMAGES = [
  {
    url: '/images/hero/hero-1.png',
    alt: 'Cuidado e acolhimento no Abrigo Viva Patas',
  },
  {
    url: '/images/hero/hero-2.png',
    alt: 'Rotina de amor e dedicação aos resgatados',
  },
  {
    url: '/images/hero/hero-3.png',
    alt: 'Animais acolhidos no Abrigo Viva Patas',
  },
  {
    url: '/images/hero/hero-4.png',
    alt: 'Proteção e reconstrução de vidas no abrigo',
  },
  {
    url: '/images/hero/hero-5.png',
    alt: 'Esperança e carinho para cada animal resgatado',
  },
];

/**
 * ============================================================================
 * CONFIGURAÇÃO DO VÍDEO WISTIA
 * ============================================================================
 * Insira o ID do seu vídeo Wistia entre as aspas abaixo.
 * Exemplo: const WISTIA_VIDEO_ID = "abc123xyz";
 * Se deixado vazio (""), o player exibirá uma moldura elegante com aviso amigável.
 */
export const WISTIA_VIDEO_ID = "qd92xcw9an";

interface CampaignPageProps {
  selectedAmount: number;
  onSelectAmount: (cents: number) => void;
  onOpenDonationModal: (cents?: number) => void;
  onQueroAjudar?: (cents?: number) => void;
  onOpenConfig?: () => void;
}

export function CampaignPage({
  selectedAmount,
  onSelectAmount,
  onOpenDonationModal,
  onQueroAjudar,
  onOpenConfig,
}: CampaignPageProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customAmountText, setCustomAmountText] = useState<string>('');

  const parseToCents = (text: string): number => {
    const clean = text.replace(/[^\d,\.]/g, '');
    if (!clean) return 0;
    const normalized = clean.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val * 100);
  };

  // Carrossel automático passando suavemente a cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleNextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
  };

  const handlePrevHero = () => {
    setCurrentHeroIndex((prev) => (prev - 1 + HERO_CAROUSEL_IMAGES.length) % HERO_CAROUSEL_IMAGES.length);
  };

  const scrollToDonationSection = () => {
    const el = document.getElementById('grid-donate-btn') || document.getElementById('doar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Pulsa o botão de doação para dar feedback visual imediato ao usuário
      el.classList.add('ring-4', 'ring-brand', 'scale-105');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-brand', 'scale-105');
      }, 1200);
    }
  };

  const handleHelpClick = (cents?: number) => {
    const value = cents || selectedAmount;
    if (onQueroAjudar) {
      onQueroAjudar(value);
    } else {
      onOpenDonationModal(value);
    }
  };

  const handleSelectAmount = (cents: number) => {
    onSelectAmount(cents);
  };

  const handleShare = () => {
    const text =
      'Conheça o trabalho do Abrigo Viva Patas. Eles acolhem e cuidam de animais resgatados com muito amor e responsabilidade. Veja como ajudar:';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${currentUrl}`)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="campaign-view" className="min-h-screen bg-surface-cream font-sans">
      {/* 1. Header Fixo Institucional */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface-cream/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/logo.png"
              alt="Logo Patas Vivas"
              className="h-10 w-10 object-contain rounded-md shadow-xs"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                PATAS VIVAS
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                Cuidadores de Animais
              </span>
            </div>
          </div>
          <button
            id="header-donate-btn"
            type="button"
            onClick={scrollToDonationSection}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
            QUERO AJUDAR
          </button>
        </div>
      </header>

      <main>
        {/* 2. Hero da Página Principal */}
        <section className="bg-surface-cream px-4 pb-8 pt-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
              Eles não conseguem pedir ajuda. Nós pedimos por eles.
            </h1>
            <div className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Todos os dias, animais são encontrados abandonados, machucados, com fome ou precisando de cuidados.
              </p>
            </div>

            {/* Carrossel Automático de Imagens (Passa a cada 3s) */}
            <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:aspect-[16/10] sm:max-h-[420px]">
              {HERO_CAROUSEL_IMAGES.map((image, idx) => (
                <div
                  key={image.url}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

              {/* Botões de Navegação Anterior / Próximo */}
              <button
                type="button"
                onClick={handlePrevHero}
                aria-label="Imagem anterior"
                className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-all hover:bg-black/65 sm:left-3.5 sm:p-2"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={handleNextHero}
                aria-label="Próxima imagem"
                className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-all hover:bg-black/65 sm:right-3.5 sm:p-2"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Indicadores (Dots) com feedback visual */}
              <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center items-center gap-1.5">
                {HERO_CAROUSEL_IMAGES.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentHeroIndex(dotIdx)}
                    aria-label={`Ir para a foto ${dotIdx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dotIdx === currentHeroIndex
                        ? 'w-6 bg-brand shadow'
                        : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* CTAs do Hero */}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                id="hero-help-btn"
                type="button"
                onClick={scrollToDonationSection}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-sm font-bold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
              >
                <Heart className="h-4 w-4 fill-current" />
                QUERO AJUDAR
              </button>
              <a
                href="#animais-acolhidos"
                className="flex items-center justify-center rounded-xl border border-border bg-card px-5 py-4 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-brand"
              >
                CONHECER OS ANIMAIS
              </a>
            </div>

            {/* Mensagem de Cuidado Contínuo */}
            <div className="mx-auto mt-4 max-w-xl space-y-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p className="font-semibold text-foreground">
                Mas o resgate é apenas o começo.
              </p>
              <p>
                Depois dele, existe uma rotina inteira de cuidado que precisa continuar.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Seção: APRESENTAÇÃO */}
        <section className="border-y border-border/60 bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Cada animal que chega até nós traz uma história
              </h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Alguns foram encontrados abandonados.
              </p>
              <p>
                Outros chegaram machucados, doentes, debilitados ou simplesmente sem ninguém para cuidar deles.
              </p>
              <p>
                Quando um animal precisa de ajuda, fazemos o possível para oferecer aquilo que ele precisa naquele momento.
              </p>
              <div className="rounded-xl border border-border/80 bg-surface-cream/60 p-3.5 space-y-1 text-xs font-medium text-foreground">
                <p>Alimentação.</p>
                <p>Higiene.</p>
                <p>Medicamentos.</p>
                <p>Acompanhamento.</p>
                <p>Atendimento veterinário.</p>
                <p className="font-bold text-brand">E, principalmente, cuidado.</p>
              </div>
              <p className="font-semibold text-foreground">
                Porque salvar um animal não termina no momento do resgate.
              </p>
              <p className="font-semibold text-foreground">
                É preciso continuar presente depois dele.
              </p>
              <p className="font-bold text-brand">
                E é nesse cuidado diário que toda ajuda faz diferença.
              </p>
            </div>
          </div>
        </section>


        {/* 5. Seção: ANIMAIS QUE CUIDAMOS */}
        <section id="animais-acolhidos" className="scroll-mt-16 bg-card px-4 py-10 border-t border-border">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Conheça alguns dos animais que fazem parte dessa história
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Por trás de cada foto existe uma história.
              </p>
              <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                São animais que precisaram de ajuda e que hoje seguem recebendo atenção, cuidado e a oportunidade de se recuperar.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {INITIAL_ANIMALS.map((animal) => (
                <div
                  key={animal.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface-cream/60 shadow-xs"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={animal.imageUrl}
                        alt={animal.name}
                        loading="lazy"
                        className={`h-full w-full object-cover ${animal.imagePosition || 'object-center'}`}
                      />
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                        {animal.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">{animal.name}</h3>
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          {animal.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {animal.description}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedAnimal(animal)}
                      className="w-full rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                      Conhecer história
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. A REALIDADE QUE NÃO PODEMOS ESCONDER: Vídeo + Pedido de Urgência */}
        <section id="rotina-e-urgencia" className="bg-surface-cream px-4 py-10">
          <div className="mx-auto max-w-2xl">
            {/* Header da Seção */}
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                A REALIDADE QUE NÃO PODEMOS ESCONDER
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Para muitos deles, a fome e a dor não podem esperar
              </h2>
              <div className="mx-auto mt-2 max-w-lg space-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <p>
                  Antes de receberem ajuda, alguns desses animais enfrentaram abandono, fome, ferimentos e dias sem os cuidados que precisavam.
                </p>
                <p>
                  São situações difíceis de ver.
                </p>
                <p className="font-medium text-foreground">
                  Mas são justamente elas que mostram por que continuar ajudando importa.
                </p>
                <p>
                  Assista ao vídeo e veja um pouco da realidade enfrentada por animais que precisam de alguém disposto a não ignorá-los.
                </p>
              </div>
            </div>

            {/* Container do Vídeo Wistia */}
            <div className="mt-6">
              <div className="mb-2 text-center">
                <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent-foreground">
                  RESGATE
                </span>
              </div>
              <WistiaPlayer videoId={WISTIA_VIDEO_ID} />
            </div>

            {/* Bloco: PEDIDO DE URGÊNCIA */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-red-300/80 bg-red-100/50 p-5 shadow-xs sm:p-6 dark:border-red-900/60 dark:bg-red-950/50">
              {/* Tag / Eyebrow */}
              <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-red-700 dark:text-red-400">
                  PEDIDO DE URGÊNCIA
                </h2>
              </div>

              {/* Título Principal */}
              <h3 className="mt-2 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                Eles precisam de cuidados todos os dias
              </h3>

              {/* Texto Explicando as Necessidades */}
              <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                <p>
                  Cuidar de animais vai muito além de oferecer carinho.
                </p>
                <p>
                  Todos os dias existem necessidades que precisam ser atendidas.
                </p>
                <p>
                  Ração, medicamentos, produtos de higiene, consultas, exames, curativos e outros cuidados fazem parte dessa rotina.
                </p>
              </div>

              {/* Texto Complementar */}
              <p className="mt-4 font-semibold text-center text-xs leading-relaxed text-foreground sm:text-sm">
                Qualquer contribuição pode ajudar a garantir um desses cuidados.
              </p>

              {/* CTA Quero Ajudar */}
              <div className="mt-5">
                <button
                  type="button"
                  id="urgencia-ajude-patas-vivas-btn"
                  onClick={scrollToDonationSection}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 px-4 text-xs font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-all hover:bg-brand-strong active:scale-[0.99] sm:text-sm"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  AJUDE O PATAS VIVAS
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Seção: DEPOIS DO RESGATE */}
        <section className="border-t border-border bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
              DEPOIS DO RESGATE
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              O resgate termina. O cuidado continua.
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground text-left sm:text-center">
              <p>
                Ser retirado de uma situação de abandono é apenas o primeiro passo.
              </p>
              <p>
                Depois disso, começam os dias de alimentação, tratamento, descanso, atenção e recuperação.
              </p>
              <div className="space-y-1 font-medium text-foreground">
                <p>É quando eles começam novamente a brincar.</p>
                <p>A confiar.</p>
                <p>A correr.</p>
                <p>A descansar sem medo.</p>
                <p>E, pouco a pouco, a entender que estão seguros.</p>
              </div>
            </div>

            <h3 className="mt-6 text-base font-bold text-foreground sm:text-lg">
              Porque uma nova oportunidade também significa poder voltar a ser feliz.
            </h3>
          </div>
        </section>

        {/* 11. Seção de Doação & 12. DOE VIA PIX */}
        <section id="doar" className="scroll-mt-16 bg-surface-alt px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                ❤️ DOE VIA PIX
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Você pode ajudar a cuidar deles hoje
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Você pode contribuir com o valor que estiver ao seu alcance.
              </p>

              {/* Cards explicativos para cada faixa de valor */}
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
                <button
                  type="button"
                  onClick={() => handleSelectAmount(1000)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    selectedAmount === 1000
                      ? 'border-brand bg-brand-soft/60 shadow-sm'
                      : 'border-border bg-card hover:border-brand/60'
                  }`}
                >
                  <div>
                    <span className="inline-block rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-black text-brand">
                      R$ 10
                    </span>
                    <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">
                      Pode ajudar com uma necessidade diária imediata.
                    </p>
                  </div>
                  <span className="text-xl">🐾</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAmount(2000)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    selectedAmount === 2000
                      ? 'border-brand bg-brand-soft/60 shadow-sm'
                      : 'border-border bg-card hover:border-brand/60'
                  }`}
                >
                  <div>
                    <span className="inline-block rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-black text-brand">
                      R$ 20
                    </span>
                    <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">
                      Pode ajudar diretamente com ração e alimentação.
                    </p>
                  </div>
                  <span className="text-xl">🥣</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAmount(5000)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    selectedAmount === 5000
                      ? 'border-brand bg-brand-soft/60 shadow-sm'
                      : 'border-border bg-card hover:border-brand/60'
                  }`}
                >
                  <div>
                    <span className="inline-block rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-black text-brand">
                      R$ 50
                    </span>
                    <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">
                      Pode contribuir para medicamentos, curativos e cuidados.
                    </p>
                  </div>
                  <span className="text-xl">🩹</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAmount(10000)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    selectedAmount === 10000
                      ? 'border-brand bg-brand-soft/60 shadow-sm'
                      : 'border-border bg-card hover:border-brand/60'
                  }`}
                >
                  <div>
                    <span className="inline-block rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-black text-brand">
                      R$ 100
                    </span>
                    <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">
                      Pode ajudar em necessidades e procedimentos maiores.
                    </p>
                  </div>
                  <span className="text-xl">🩺</span>
                </button>
              </div>

              <p className="mt-4 text-center text-sm font-bold text-foreground">
                Não existe um valor pequeno quando ele ajuda um animal.
              </p>
            </div>

            {/* Grid de Valores de Doação */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {DONATION_AMOUNTS.map((cents) => {
                const isSelected = !isCustomAmount && selectedAmount === cents;
                const isPopular = cents === POPULAR_AMOUNT;
                return (
                  <button
                    key={cents}
                    id={`amount-btn-${cents}`}
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(false);
                      handleSelectAmount(cents);
                    }}
                    aria-pressed={isSelected}
                    className={`relative rounded-xl border py-3.5 text-sm font-bold transition-all ${
                      isSelected
                        ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                        : 'border-border bg-card text-foreground hover:border-brand'
                    }`}
                  >
                    {formatBRL(cents)}
                    {isPopular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-brand-strong px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-brand-foreground shadow">
                        Mais doado
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Botão Outro Valor no Grid */}
              <button
                type="button"
                id="amount-btn-custom"
                onClick={() => {
                  setIsCustomAmount(true);
                  if (!customAmountText) {
                    setCustomAmountText('25');
                    onSelectAmount(2500);
                  } else {
                    const parsed = parseToCents(customAmountText);
                    if (parsed >= 300) onSelectAmount(parsed);
                  }
                }}
                aria-pressed={isCustomAmount}
                className={`col-span-2 sm:col-span-4 relative flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold transition-all ${
                  isCustomAmount
                    ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                    : 'border-dashed border-brand/60 bg-brand-soft/20 text-brand-strong hover:border-brand hover:bg-brand-soft/40'
                }`}
              >
                <span>✍️ Digitar outro valor</span>
              </button>
            </div>

            {/* Painel Interativo de Outro Valor */}
            {isCustomAmount && (
              <div className="mt-3.5 rounded-2xl border border-brand/40 bg-brand-soft/30 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="custom-donation-input" className="text-xs font-bold text-foreground">
                    Digite o valor da sua contribuição:
                  </label>
                  <span className="text-xs font-extrabold text-brand">
                    {selectedAmount >= 300 ? formatBRL(selectedAmount) : 'Mínimo R$ 3,00'}
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-base font-black text-brand">
                    R$
                  </div>
                  <input
                    id="custom-donation-input"
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={customAmountText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomAmountText(val);
                      const parsed = parseToCents(val);
                      if (parsed >= 300) {
                        onSelectAmount(parsed);
                      }
                    }}
                    placeholder="Ex: 15, 25, 45, 150"
                    className="block w-full rounded-xl border border-brand bg-card py-3 pl-11 pr-3 text-base font-black text-foreground shadow-2xs focus:border-brand-strong focus:outline-hidden focus:ring-2 focus:ring-brand/30"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Você pode doar qualquer valor a partir de R$ 3,00. Todo apoio faz a diferença!
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">Sugestões rápidas:</span>
                  {[1500, 2500, 4000, 15000, 50000].map((sugCents) => (
                    <button
                      key={sugCents}
                      type="button"
                      onClick={() => {
                        const reais = (sugCents / 100).toString();
                        setCustomAmountText(reais);
                        onSelectAmount(sugCents);
                      }}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:border-brand hover:text-brand transition-colors"
                    >
                      {formatBRL(sugCents)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botão de Ação Principal de Doação */}
            <button
              id="grid-donate-btn"
              type="button"
              onClick={() => handleHelpClick()}
              disabled={selectedAmount < 300}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-sm font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Heart className="h-4 w-4 fill-current" />
              QUERO AJUDAR COM {formatBRL(selectedAmount)}
            </button>
          </div>
        </section>

        {/* 16. Seção: INSTITUCIONAL */}
        <section className="border-t border-border bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                INSTITUCIONAL
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Sobre o Patas Vivas
              </h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                O Patas Vivas nasceu da união de pessoas que acreditam que todo animal merece uma segunda oportunidade.
              </p>
              <p>
                Somos um grupo de cuidadores que se dedica a ajudar animais que precisam de proteção, alimentação, cuidados e, quando necessário, atendimento veterinário.
              </p>
              <p>
                Alguns chegam depois de situações de abandono.
              </p>
              <p>
                Outros precisam de tratamento.
              </p>
              <p>
                Outros simplesmente precisavam que alguém enxergasse sua situação e decidisse ajudar.
              </p>
              <p className="font-semibold text-foreground">
                Nosso trabalho é estar presente depois disso.
              </p>
              <p className="font-semibold text-foreground">
                Porque cuidar não é apenas resgatar.
              </p>
              <p className="font-bold text-brand">
                É continuar cuidando todos os dias.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-surface-cream/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Stethoscope className="h-4 w-4 text-brand" />
                <span>Atendimento e cuidados veterinários</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Quando necessário, os animais podem precisar de consultas, exames, medicamentos, curativos e outros cuidados veterinários durante sua recuperação.
              </p>
            </div>
          </div>
        </section>

        {/* 17. Seção: COMUNIDADE */}
        <section className="bg-surface-cream px-4 py-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
              COMUNIDADE
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Uma corrente de cuidado construída por muitas mãos
            </h2>
            <div className="mx-auto mt-3 max-w-lg space-y-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <p>Nenhum cuidado acontece sozinho.</p>
              <p>Uma pessoa ajuda com uma sacola de ração.</p>
              <p>Outra contribui para um medicamento.</p>
              <p>Outra ajuda em uma consulta.</p>
              <p>E outra compartilha essa história com alguém.</p>
              <p className="font-semibold text-foreground">
                Quando várias pessoas fazem um pouco, conseguimos fazer muito mais.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center">
              <blockquote className="text-sm font-semibold italic leading-relaxed text-foreground">
                “Eles não conseguem pedir ajuda. Por isso, nós pedimos por eles.”
              </blockquote>
              <p className="mt-2 text-xs font-bold text-brand">
                — Patas Vivas · Cuidadores de Animais
              </p>
            </div>
          </div>
        </section>

        {/* 18. Seção: COMPARTILHE */}
        <section className="bg-surface-cream px-4 pb-12 pt-2">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-300/80 bg-red-100/50 p-6 text-center shadow-sm dark:border-red-900/60 dark:bg-red-950/50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
              COMPARTILHE
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-foreground sm:text-2xl">
              Eles precisam de cuidado todos os dias.
            </h2>
            <div className="mx-auto mt-3 max-w-lg space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <p>
                O Patas Vivas continua ajudando animais que precisam de alimentação, proteção, tratamento e atenção.
              </p>
              <p>
                Se você puder contribuir, faça parte dessa corrente.
              </p>
              <p className="font-medium text-foreground">
                E se não puder doar agora, você também pode ajudar fazendo essa mensagem chegar a mais pessoas.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                id="final-cta-btn"
                type="button"
                onClick={scrollToDonationSection}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
              >
                <Heart className="h-4 w-4 fill-current" />
                QUERO AJUDAR COM {formatBRL(selectedAmount)}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-brand bg-card px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-brand-soft"
              >
                <Share2 className="h-4 w-4" />
                COMPARTILHAR NO WHATSAPP
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 19. Rodapé Oficial */}
      <footer className="border-t border-border bg-surface-alt px-4 pb-12 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/images/logo.png"
            alt="Logo Patas Vivas"
            className="mx-auto mb-3 h-16 w-16 object-contain"
          />
          <p className="text-sm font-extrabold text-foreground">PATAS VIVAS</p>
          <p className="text-xs font-semibold text-muted-foreground">Cuidadores de Animais</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Cuidado, proteção e novas oportunidades para animais que precisam de uma segunda chance.
          </p>

          <p className="mt-5 rounded-xl border border-brand/30 bg-brand-soft/50 p-3 text-[11px] leading-relaxed text-accent-foreground">
            O Patas Vivas é um projeto independente de cuidado e proteção animal. As contribuições ajudam nas necessidades dos animais, incluindo alimentação, medicamentos, tratamentos e atendimento veterinário.
          </p>

          <div className="mt-4 flex flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            {onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="text-[10px] text-muted-foreground/80 hover:text-foreground hover:underline transition-colors"
              >
                Configurações da Campanha
              </button>
            )}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/80">
            © Patas Vivas · Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Modal de Detalhes do Animal */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {selectedAnimal.tag}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-foreground">
                  História de {selectedAnimal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnimal(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <img
                src={selectedAnimal.imageUrl}
                alt={selectedAnimal.name}
                className={`max-h-60 w-full rounded-xl object-cover ${selectedAnimal.imagePosition || 'object-center'}`}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  Status: {selectedAnimal.status}
                </span>
              </div>
              
              <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">
                  {selectedAnimal.description}
                </p>
                {selectedAnimal.fullStory && (
                  <p className="border-t border-border/60 pt-2.5">
                    {selectedAnimal.fullStory}
                  </p>
                )}
                {selectedAnimal.rescueDetails && (
                  <div className="rounded-xl border border-border/80 bg-surface-cream/70 p-3 text-[11px]">
                    <strong className="text-foreground">Cuidados atuais: </strong>
                    {selectedAnimal.rescueDetails}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAnimal(null);
                  scrollToDonationSection();
                }}
                className="flex-1 rounded-xl bg-brand py-3 text-xs font-bold uppercase tracking-wide text-brand-foreground hover:bg-brand-strong"
              >
                Ajudar com Doação
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnimal(null)}
                className="rounded-xl border border-border px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
