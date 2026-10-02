import { useState, useEffect, FormEvent } from 'react';
import {
  getPixKey,
  savePixKey,
  DEFAULT_PIX_KEY,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_CONFIG_EVENT,
  SupabaseConfig,
} from '../lib/config';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Server,
  KeyRound,
  Check,
  QrCode,
  Sliders,
  BarChart3,
  CreditCard,
  Zap,
} from 'lucide-react';
import { createMasterfyPayment } from '../lib/masterfy';

type ConnectionStatus = 'not_configured' | 'configured' | 'success' | 'failed';

interface ConfigPageProps {
  onBackToCampaign?: () => void;
}

export function ConfigPage({ onBackToCampaign }: ConfigPageProps) {
  // PIX Key state
  const [pixKeyInput, setPixKeyInput] = useState<string>(getPixKey);

  // Supabase states
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>('');
  const [showSupabaseKey, setShowSupabaseKey] = useState<boolean>(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus>(() => {
    const cur = getSupabaseConfig();
    return cur.isConfigured ? 'configured' : 'not_configured';
  });

  // Masterfy test state
  const [isTestingMasterfy, setIsTestingMasterfy] = useState<boolean>(false);
  const [masterfyStatus, setMasterfyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [masterfyDetails, setMasterfyDetails] = useState<string | null>(null);

  // Global feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    const curPix = getPixKey();
    setPixKeyInput(curPix);

    const curSupa = getSupabaseConfig();
    setSupabaseConfig(curSupa);
    if (curSupa.source === 'localStorage') {
      setSupabaseUrlInput(curSupa.url);
      setSupabaseKeyInput(curSupa.publishableKey);
    }
    setSupabaseStatus(curSupa.isConfigured ? 'configured' : 'not_configured');
  }, []);

  useEffect(() => {
    const handleSupaChange = () => {
      const cur = getSupabaseConfig();
      setSupabaseConfig(cur);
      setSupabaseStatus(cur.isConfigured ? 'configured' : 'not_configured');
    };

    window.addEventListener(SUPABASE_CONFIG_EVENT, handleSupaChange);

    return () => {
      window.removeEventListener(SUPABASE_CONFIG_EVENT, handleSupaChange);
    };
  }, []);

  // 1. SALVAR CONFIGURAÇÕES
  const handleSave = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setFeedbackMessage(null);

    const cleanPixKey = pixKeyInput.trim();
    if (cleanPixKey) {
      savePixKey(cleanPixKey);
    } else {
      savePixKey(DEFAULT_PIX_KEY);
      setPixKeyInput(DEFAULT_PIX_KEY);
    }

    // Salvar Supabase se preenchido
    const cleanSupaUrl = supabaseUrlInput.trim();
    const cleanSupaKey = supabaseKeyInput.trim();
    if (cleanSupaUrl && cleanSupaKey) {
      saveSupabaseConfig(cleanSupaUrl, cleanSupaKey);
      setSupabaseStatus('configured');
    }

    setFeedbackMessage({
      type: 'success',
      text: 'Configurações salvas com sucesso no navegador.',
    });

    setTimeout(() => {
      setFeedbackMessage((prev) => (prev?.type === 'success' ? null : prev));
    }, 4000);
  };

  // 2. LIMPAR CONFIGURAÇÕES
  const handleClear = () => {
    clearSupabaseConfig();
    savePixKey('');

    setPixKeyInput(DEFAULT_PIX_KEY);
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseStatus('not_configured');

    setFeedbackMessage({
      type: 'info',
      text: 'Credenciais personalizadas limpas. Restaurado para a chave padrão do abrigo.',
    });

    setTimeout(() => {
      setFeedbackMessage((prev) => (prev?.type === 'info' ? null : prev));
    }, 3000);
  };

  // 3. TESTAR CONEXÃO SUPABASE
  const handleTestSupabase = async () => {
    const url = supabaseUrlInput.trim() || supabaseConfig.url;
    const key = supabaseKeyInput.trim() || supabaseConfig.publishableKey;

    if (!url || !key) {
      setSupabaseStatus('failed');
      setFeedbackMessage({
        type: 'error',
        text: 'Preencha a URL e a Publishable Key do Supabase.',
      });
      return;
    }

    setIsTestingSupabase(true);
    try {
      const res = await testSupabaseConnection(url, key);
      if (res.success) {
        setSupabaseStatus('success');
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Conexão com o Supabase realizada com sucesso.',
        });
      } else {
        setSupabaseStatus('failed');
        setFeedbackMessage({
          type: 'error',
          text: res.message || 'Falha ao conectar com o Supabase.',
        });
      }
    } catch {
      setSupabaseStatus('failed');
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // 4. TESTAR CONEXÃO MASTERFY API
  const handleTestMasterfy = async () => {
    setIsTestingMasterfy(true);
    setMasterfyStatus('idle');
    setMasterfyDetails(null);

    try {
      // Teste com valor padrão de R$ 10,00 (1000 centavos)
      const res = await createMasterfyPayment(1000);
      if (res.success && res.copypaste) {
        setMasterfyStatus('success');
        setMasterfyDetails(`PIX gerado com sucesso! ID: ${res.id}`);
        setFeedbackMessage({
          type: 'success',
          text: `Gateway Masterfy Pagamentos conectado com sucesso! Transação ID: ${res.id}`,
        });
      } else {
        setMasterfyStatus('error');
        setMasterfyDetails(res.error || 'Falha ao comunicar com Masterfy');
        setFeedbackMessage({
          type: 'error',
          text: `Erro ao testar Masterfy: ${res.error || 'Verifique as configurações.'}`,
        });
      }
    } catch (err: any) {
      setMasterfyStatus('error');
      setMasterfyDetails(err?.message || 'Erro inesperado');
    } finally {
      setIsTestingMasterfy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt pb-16 pt-6">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-xs border border-brand/20">
              <Sliders className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Configurações da Campanha
              </h1>
              <p className="text-xs text-muted-foreground">
                Gerenciamento de chave de recebimento PIX e integrações.
              </p>
            </div>
          </div>

          {onBackToCampaign && (
            <button
              type="button"
              onClick={onBackToCampaign}
              className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-colors"
            >
              Voltar à Campanha
            </button>
          )}
        </div>

        {/* Security & Instructions Notice Card */}
        <div className="mb-6 rounded-2xl border border-brand/30 bg-brand-soft/40 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">Recebimento Direto via PIX</p>
              <p className="mt-0.5">
                Defina abaixo a chave PIX (e-mail, CPF/CNPJ, telefone ou chave aleatória) que
                receberá as doações de forma direta. O QR Code dinâmico e o código Copia e Cola
                são gerados instantaneamente com base nesta chave.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Campo: Chave PIX Recebedora */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="pix-receiver-key"
                  className="block text-xs font-bold uppercase tracking-wider text-foreground"
                >
                  Chave PIX Recebedora
                </label>
                <span className="text-[10px] font-bold uppercase text-brand">
                  Principal
                </span>
              </div>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <QrCode className="h-4 w-4 text-brand" />
                </div>
                <input
                  id="pix-receiver-key"
                  name="pixReceiverKey"
                  type="text"
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  placeholder="Seu e-mail, telefone, CPF/CNPJ ou chave aleatória"
                  autoComplete="off"
                  spellCheck="false"
                  className="block w-full rounded-xl border border-border bg-surface-alt py-3 pl-10 pr-3 text-xs font-medium text-foreground placeholder:font-sans placeholder:text-muted-foreground/60 focus:border-brand focus:bg-card focus:outline-hidden focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Chave padrão do abrigo: <code>{DEFAULT_PIX_KEY}</code>. As doações geradas no site caem diretamente na sua conta bancária.
              </p>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div
                id="config-feedback-message"
                className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                  feedbackMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                    : feedbackMessage.type === 'error'
                    ? 'border-rose-200 bg-rose-50/90 text-rose-900'
                    : 'border-border bg-muted/60 text-foreground'
                }`}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : feedbackMessage.type === 'error' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                )}
                <div className="font-semibold leading-relaxed">{feedbackMessage.text}</div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  id="save-config-btn"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-foreground shadow-xs transition-colors hover:bg-brand-strong sm:col-span-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Configurações
                </button>
              </div>

              {/* Botão: LIMPAR */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  id="clear-config-btn"
                  onClick={handleClear}
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Restaurar Padrões
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Seção Gateway Masterfy Pagamentos */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-foreground">
                Gateway PIX Masterfy Pagamentos
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conectado
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            API oficial integrada via proxy seguro no backend (/api/pix/*). Gera cobranças PIX dinâmicas com QR Code do Banco Central e validação de status em tempo real.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-foreground">
                Endpoint da API
              </label>
              <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-surface-alt py-2.5 px-3 font-mono text-xs text-foreground">
                <span className="truncate pr-2">https://api.masterfypagamentos.com/v1/payment</span>
                <span className="shrink-0 text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Proxy Ativo
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-foreground">
                Autenticação
              </label>
              <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-surface-alt py-2.5 px-3 font-mono text-xs text-foreground">
                <span className="truncate pr-2">Bearer 9X7f-3eB7vy...JcxTkaVE</span>
                <span className="shrink-0 text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Protegido no Servidor
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestMasterfy}
                disabled={isTestingMasterfy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-60 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              >
                {isTestingMasterfy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    Testando comunicação com Masterfy...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    Testar API Masterfy (Gerar PIX de Teste)
                  </>
                )}
              </button>
            </div>

            {masterfyDetails && (
              <div
                className={`mt-2 rounded-xl border p-3 text-[11px] font-medium ${
                  masterfyStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}
              >
                {masterfyDetails}
              </div>
            )}
          </div>
        </div>

        {/* Seção UTMify / Pixel de Rastreamento */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-bold text-foreground">
                Pixel de Rastreamento UTM (UTMify)
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ativo
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Script oficial da UTMify instalado globalmente no cabeçalho (&lt;head&gt;) para rastreamento de tráfego, captura automática de parâmetros UTM e mensuração de conversões.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-foreground">
                Pixel ID Ativo
              </label>
              <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-surface-alt py-2.5 px-3 font-mono text-xs text-foreground">
                <span className="font-semibold text-brand">6ab5f2ae7b3eef76af584912</span>
                <span className="text-[10px] font-sans font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Carregado no &lt;head&gt;
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-brand/20 bg-brand-soft/20 p-3 text-[11px] text-muted-foreground">
              <p className="font-semibold text-foreground">Parâmetros capturados automaticamente:</p>
              <p className="mt-0.5 text-[10px] font-mono text-foreground/80">
                utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck
              </p>
            </div>
          </div>
        </div>

        {/* Seção Opcional: Supabase */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-foreground">
              Integração Supabase (Opcional)
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Conecte seu projeto Supabase para registrar doações e sincronizar com o banco de dados.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-foreground">
                Supabase URL
              </label>
              <input
                type="url"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://seu-projeto.supabase.co"
                className="mt-1 block w-full rounded-xl border border-border bg-surface-alt py-2.5 px-3 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-foreground">
                Supabase Anon / Publishable Key
              </label>
              <div className="relative mt-1">
                <input
                  type={showSupabaseKey ? 'text' : 'password'}
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="block w-full rounded-xl border border-border bg-surface-alt py-2.5 pl-3 pr-10 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showSupabaseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-alt px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                {isTestingSupabase ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-brand" />
                    Testar Conexão Supabase
                  </>
                )}
              </button>
              <span className="text-[11px] font-medium text-muted-foreground">
                Status: {supabaseStatus === 'success' ? (
                  <span className="text-emerald-600 font-bold">Conectado</span>
                ) : supabaseStatus === 'failed' ? (
                  <span className="text-rose-600 font-bold">Falha na conexão</span>
                ) : supabaseStatus === 'configured' ? (
                  <span className="text-sky-600 font-bold">Configurado</span>
                ) : (
                  'Não configurado'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
