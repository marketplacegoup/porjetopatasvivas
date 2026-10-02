import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, SUPABASE_CONFIG_EVENT } from './config';

// Singleton Supabase client for the browser
let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Resets the active Supabase client instance so new credentials take effect immediately.
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
  currentConfigKey = '';
}

// Automatically listen for configuration changes
if (typeof window !== 'undefined') {
  window.addEventListener(SUPABASE_CONFIG_EVENT, () => {
    resetSupabaseClient();
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config.isConfigured || !config.url || !config.publishableKey) {
    resetSupabaseClient();
    return null;
  }

  const newKey = `${config.url}::${config.publishableKey}`;

  if (supabaseInstance && currentConfigKey === newKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigKey = newKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

export interface CreatePixResponse {
  success: boolean;
  payment_id?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  error?: string;
}

export interface CheckStatusResponse {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Calls the Supabase Edge Function `create-pix`
 * Validates amount, avoids exposing sensitive credentials, and formats the response.
 */
export async function createPixPayment(
  amount: number,
  payerEmail?: string
): Promise<CreatePixResponse> {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: 'Valor de doação inválido. Escolha um valor maior que zero.',
    };
  }

  if (amount > 10000) {
    return {
      success: false,
      error: 'O valor máximo permitido é de R$ 10.000,00.',
    };
  }

  const payload: { amount: number; payer_email?: string } = {
    amount: Number(amount.toFixed(2)),
  };

  if (payerEmail && payerEmail.trim().includes('@')) {
    payload.payer_email = payerEmail.trim();
  }

  const client = getSupabaseClient();

  try {
    // 1. Try invoking via Supabase client if configured
    if (client) {
      const { data, error } = await client.functions.invoke<CreatePixResponse>('create-pix', {
        body: payload,
      });

      if (error) {
        console.error('Erro ao invocar create-pix no Supabase:', error);

        // In supabase-js, if Edge Function returns non-2xx (like 400), error context may contain the JSON response
        let backendMessage: string | null = null;
        try {
          if ('context' in error && error.context && typeof error.context.json === 'function') {
            const errJson = await error.context.json();
            if (errJson?.error) backendMessage = errJson.error;
          }
        } catch {
          // Ignore context read error
        }

        return {
          success: false,
          error: backendMessage || error.message || 'Não foi possível gerar o PIX agora. Tente novamente.',
        };
      }

      if (data && data.success) {
        return data;
      }

      if (data && data.error) {
        return {
          success: false,
          error: data.error,
        };
      }
    }

    const config = getSupabaseConfig();

    // 2. Direct fallback to URL if Supabase URL is available
    if (config.url) {
      const endpoint = `${config.url.replace(/\/+$/, '')}/functions/v1/create-pix`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.publishableKey ? { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data: CreatePixResponse = await res.json();
      if (res.ok && data?.success) {
        return data;
      }

      return {
        success: false,
        error: data?.error || 'Não foi possível gerar o PIX agora. Tente novamente.',
      };
    }

    // If neither Supabase client nor URL is set yet, return clear friendly message
    return {
      success: false,
      error: 'Supabase não configurado. Acesse a aba Configuração para conectar seu projeto.',
    };
  } catch (err) {
    console.error('Exceção ao chamar create-pix:', err);
    return {
      success: false,
      error: 'Não foi possível gerar o PIX agora. Tente novamente.',
    };
  }
}

/**
 * Periodically checks the PIX payment status by payment_id
 */
export async function checkPixStatus(paymentId: string): Promise<CheckStatusResponse> {
  if (!paymentId) return { success: false, error: 'ID de pagamento ausente' };

  const client = getSupabaseClient();

  try {
    // 1. Try checking via check-pix-status Edge function if deployed
    if (client) {
      const { data } = await client.functions.invoke<{
        success: boolean;
        status: string;
      }>('check-pix-status', {
        body: { payment_id: paymentId },
      });

      if (data?.status) {
        return { success: true, status: data.status };
      }
    }

    // 2. Query donation_payments table in Supabase
    if (client) {
      const { data: dbData } = await client
        .from('donation_payments')
        .select('status')
        .eq('payment_id', String(paymentId))
        .maybeSingle();

      if (dbData) {
        const currentStatus = dbData.status === 'approved' ? 'approved' : dbData.status || 'pending';
        return { success: true, status: currentStatus };
      }
    }

    return { success: true, status: 'pending' };
  } catch (err) {
    console.warn('Erro silencioso ao verificar status do PIX:', err);
    return { success: false, status: 'pending' };
  }
}
