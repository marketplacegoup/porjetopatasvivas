import { useState, useEffect, useRef } from 'react';
import { formatBRL } from '../data';
import { getPixKey } from '../lib/config';
import { generateInstantPix } from '../lib/pixUtils';
import { createMasterfyPayment, checkMasterfyStatus } from '../lib/masterfy';
import {
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  Zap,
  QrCode,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';

interface CheckoutModalProps {
  cents: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ cents, isOpen, onClose }: CheckoutModalProps) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string>('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [gatewayName, setGatewayName] = useState<string>('Masterfy Pagamentos');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const safeCents = typeof cents === 'number' && !isNaN(cents) && cents > 0 ? cents : 10000;
  const formattedValue = formatBRL(safeCents);
  const numericAmount = Number((safeCents / 100).toFixed(2));
  const pixKey = getPixKey();

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  /**
   * Gera a cobrança PIX via Masterfy com fallback local de alta disponibilidade
   */
  const loadPixPayment = async () => {
    stopPolling();
    setErrorMessage(null);
    setCopiedPayload(false);
    setStatus('loading');

    if (safeCents <= 0) {
      setStatus('error');
      setErrorMessage('Valor de contribuição inválido.');
      return;
    }

    try {
      // 1. Tentar gerar via Masterfy Pagamentos API oficial
      const masterfyRes = await createMasterfyPayment(safeCents);

      if (!isMountedRef.current) return;

      if (masterfyRes.success && masterfyRes.copypaste) {
        setPixPayload(masterfyRes.copypaste);
        setPixQrCodeUrl(masterfyRes.qrCodeBase64 || '');
        setPaymentId(masterfyRes.id || null);
        setGatewayName('Masterfy Pagamentos');
        setStatus('pending');

        // Polling do status na Masterfy com intervalo amigável (6 segundos) e limite de tentativas
        if (masterfyRes.id) {
          const currentId = masterfyRes.id;
          let pollAttempts = 0;
          const maxAttempts = 60; // 6 minutos

          pollIntervalRef.current = setInterval(async () => {
            pollAttempts++;
            if (pollAttempts > maxAttempts) {
              stopPolling();
              return;
            }

            try {
              const check = await checkMasterfyStatus(currentId);
              if (!isMountedRef.current) return;

              if (check.isPaid || check.status === 'PAID' || check.status === 'APPROVED') {
                setStatus('approved');
                stopPolling();
              }
            } catch {
              // verificação silenciosa
            }
          }, 6000);
        }
        return;
      }

      // 2. Se Masterfy falhar, fallback gracioso para geração local (Bacen)
      console.warn('Masterfy indisponível, usando gerador local Bacen:', masterfyRes.error);
      const instant = await generateInstantPix(numericAmount, pixKey);

      if (!isMountedRef.current) return;

      if (instant && instant.qr_code) {
        setPixPayload(instant.qr_code);
        setPixQrCodeUrl(instant.qr_code_base64);
        setGatewayName('PIX Direto Bacen');
        setStatus('pending');
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível gerar a cobrança PIX no momento.');
      }
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      if (!isMountedRef.current) return;
      setStatus('error');
      setErrorMessage('Ocorreu um erro ao gerar o PIX. Tente novamente.');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      loadPixPayment();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isOpen, cents]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedPayload(true);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedPayload(false);
      }, 3000);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs"
    >
      <div
        id="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento via PIX"
        className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6 border border-border"
      >
        {/* Header PIX Oficial */}
        <div className="flex items-start justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-xs border border-emerald-500/20">
              <QrCode className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                PIX Instantâneo Oficial
              </span>
              <h2 className="text-sm font-extrabold tracking-tight text-foreground">
                Pagamento 100% Seguro
              </h2>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 rounded-full p-1 text-2xl leading-none text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>

        {/* Selected Value Card */}
        <div className="mt-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center dark:border-emerald-950 dark:bg-emerald-950/30">
          <p className="text-[11px] font-semibold text-muted-foreground">Valor da contribuição:</p>
          <p className="mt-0.5 text-2xl font-black text-emerald-700 dark:text-emerald-400">{formattedValue}</p>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>Processado via {gatewayName}</span>
          </div>
        </div>

        {/* State: Loading */}
        {status === 'loading' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-foreground">Gerando QR Code PIX oficial...</p>
            <p className="text-[11px] text-muted-foreground">Conectando com a API Masterfy</p>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="mt-5 space-y-4 text-center">
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
              <p className="mt-2 text-xs font-semibold">
                {errorMessage || 'Não foi possível gerar a cobrança PIX.'}
              </p>
            </div>
            <button
              id="retry-pix-btn"
              type="button"
              onClick={loadPixPayment}
              className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* State: Approved */}
        {status === 'approved' && (
          <div className="mt-5 space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="mt-2 text-base font-extrabold text-emerald-900 dark:text-emerald-300">
                Pagamento PIX Aprovado! ❤️
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                Sua contribuição de <strong>{formattedValue}</strong> foi confirmada instantaneamente pelo gateway.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
                Muito obrigado por ajudar a manter a alimentação, o tratamento e o abrigo dos
                animais acolhidos do Patas Vivas.
              </p>
            </div>
            <button
              id="approved-close-btn"
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
            >
              Concluir
            </button>
          </div>
        )}

        {/* State: Pending / PIX Created */}
        {status === 'pending' && pixPayload && (
          <div className="mt-3.5 space-y-3.5">
            {/* Super Fast Badge */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-900 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 fill-emerald-600 text-emerald-600 animate-pulse" />
                <span className="font-bold">QR Code PIX Gerado</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Aguardando pagamento</span>
              </div>
            </div>

            {/* QR Code Container */}
            {pixQrCodeUrl && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-3.5 shadow-xs">
                <div className="flex items-center gap-1 text-xs font-extrabold text-foreground mb-2">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>Escaneie com o app do seu banco:</span>
                </div>
                <div className="relative rounded-2xl border-2 border-emerald-300 bg-white p-2.5 shadow-sm">
                  <img
                    src={pixQrCodeUrl}
                    alt="QR Code PIX"
                    className="h-44 w-44 rounded-lg object-contain"
                  />
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                      PIX BANCO CENTRAL
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground font-medium">
                  Aponte a câmera para pagar <strong>{formattedValue}</strong>
                </p>
              </div>
            )}

            {/* PIX Copia e Cola */}
            {pixPayload && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Código PIX Copia e Cola:
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                    {gatewayName}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-surface-alt p-2.5">
                  <span className="truncate font-mono text-[11px] text-foreground pr-2 select-all">
                    {pixPayload}
                  </span>
                  <button
                    id="copy-pix-btn"
                    type="button"
                    onClick={() => copyToClipboard(pixPayload)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-95"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        COPIAR PIX
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Passo a Passo */}
            <div className="rounded-xl border border-border bg-surface-alt p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Como pagar com PIX:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>Abra o aplicativo do seu banco (Nubank, Itaú, Bradesco, Inter, Santander, Caixa, etc.).</li>
                <li>Escolha <strong>PIX</strong> &gt; <strong>PIX Copia e Cola</strong> ou <strong>Ler QR Code</strong>.</li>
                <li>Cole o código copiado acima ou aponte a câmera para o QR Code.</li>
                <li>Confirme a doação de <strong>{formattedValue}</strong>. A confirmação é instantânea.</li>
              </ol>
            </div>

            {/* Selo de Garantia no Rodapé do Modal */}
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Garantia de Segurança <strong>Banco Central do Brasil</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
