/**
 * Masterfy Pagamentos API Client
 * Comunica com o backend Express (/api/pix/*) para gerar cobranças PIX oficiais
 * e consultar o status em tempo real com proteção estrita contra estruturas circulares.
 */

export interface MasterfyPixResponse {
  success: boolean;
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  copypaste?: string;
  qrCodeBase64?: string;
  description?: string;
  createdAt?: string;
  externalRef?: string;
  error?: string;
}

export interface MasterfyStatusResponse {
  success: boolean;
  id?: string;
  status?: string; // PENDING, PAID, APPROVED, etc.
  isPaid?: boolean;
  paidAt?: string | null;
  amount?: number;
  error?: string;
  rateLimited?: boolean;
}

export interface DonorInfo {
  name?: string;
  email?: string;
  taxId?: string;
  phone?: string;
}

/**
 * Cria cobrança PIX via Masterfy Pagamentos
 * @param amountInCents Valor em centavos (ex: 10000 = R$ 100,00)
 * @param donor Dados opcionais do doador
 */
export async function createMasterfyPayment(
  amountInCents: number,
  donor?: DonorInfo
): Promise<MasterfyPixResponse> {
  try {
    // Sanitização rigorosa do valor: garante sempre número primitivo
    let safeAmount = 10000;
    if (typeof amountInCents === 'number' && !isNaN(amountInCents) && amountInCents > 0) {
      safeAmount = Math.round(amountInCents);
    } else if (typeof amountInCents === 'string') {
      const parsed = parseInt(amountInCents, 10);
      if (!isNaN(parsed) && parsed > 0) safeAmount = parsed;
    }

    // Extrai apenas campos de texto primitivos do doador (evita passar SyntheticEvent / DOM nodes)
    const safePayload = {
      amount: safeAmount,
      description: 'Contribuição Patas Vivas',
      payerName: donor && typeof donor.name === 'string' ? donor.name.trim() : undefined,
      payerEmail: donor && typeof donor.email === 'string' ? donor.email.trim() : undefined,
      payerTaxId: donor && typeof donor.taxId === 'string' ? donor.taxId.trim() : undefined,
      payerPhone: donor && typeof donor.phone === 'string' ? donor.phone.trim() : undefined,
    };

    const res = await fetch('/api/pix/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safePayload),
    });

    const data: MasterfyPixResponse = await res.json();
    return data;
  } catch (error: any) {
    console.error('Erro na requisição para /api/pix/create:', error);
    return {
      success: false,
      error: 'Não foi possível conectar ao servidor de pagamento.',
    };
  }
}

/**
 * Consulta o status atualizado do pagamento PIX na Masterfy
 * @param paymentId ID da transação Masterfy
 */
export async function checkMasterfyStatus(
  paymentId: string
): Promise<MasterfyStatusResponse> {
  try {
    if (!paymentId || typeof paymentId !== 'string') {
      return { success: false, isPaid: false, error: 'ID de pagamento inválido.' };
    }

    const res = await fetch(`/api/pix/status/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
    });

    const data: MasterfyStatusResponse = await res.json();
    return data;
  } catch (error: any) {
    console.warn('Erro ao consultar status na Masterfy:', error);
    return {
      success: false,
      error: 'Falha ao consultar status.',
      isPaid: false,
    };
  }
}
