import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import QRCode from 'qrcode';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Masterfy configuration
const MASTERFY_API_URL = process.env.MASTERFY_API_URL || 'https://api.masterfypagamentos.com/v1/payment';
const MASTERFY_API_TOKEN = (process.env.MASTERFY_API_TOKEN || '9X7f-3eB7vy3Qsn9H8NnenovR7vpGjPyVz_JcxTkaVE').replace(/^Bearer\s+/i, '');

// In-memory status cache to protect against rate limits (429 Too Many Requests)
interface CachedStatus {
  id: string;
  status: string;
  isPaid: boolean;
  paidAt: string | null;
  amount?: number;
  timestamp: number;
}
const statusCache = new Map<string, CachedStatus>();
const STATUS_CACHE_TTL_MS = 6000; // 6 seconds cache per payment ID

/**
 * Validates a Brazilian CPF number
 */
function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
}

/**
 * Generates a valid test CPF algorithmically when donor doesn't supply one
 */
function generateValidCpf(): string {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rnd(10));
  let d1 = n.reduce((a, v, i) => a + v * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);
  let d2 = n.reduce((a, v, i) => a + v * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);
  return n.join('');
}

/**
 * POST /api/pix/create
 * Creates a real PIX transaction on Masterfy Pagamentos API
 */
app.post('/api/pix/create', async (req: Request, res: Response) => {
  try {
    const {
      amount, // amount in cents (e.g., 2000 = R$ 20.00)
      description = 'Doação Patas Vivas',
      payerName = 'Doador Patas Vivas',
      payerEmail = 'doador@patasvivas.org.br',
      payerTaxId,
      payerPhone = '11999999999',
      externalRef,
    } = req.body;

    // Validate amount safely against non-number / object values
    let parsedAmount = 10000;
    if (typeof amount === 'number' && !isNaN(amount) && amount > 0) {
      parsedAmount = Math.round(amount);
    } else if (typeof amount === 'string') {
      const parsed = parseInt(amount, 10);
      if (!isNaN(parsed) && parsed > 0) parsedAmount = parsed;
    }

    // Ensure valid CPF (use donor's if valid, otherwise generate valid format)
    const cleanTaxId = typeof payerTaxId === 'string' ? payerTaxId.replace(/\D/g, '') : '';
    const effectiveTaxId = cleanTaxId && isValidCpf(cleanTaxId) ? cleanTaxId : generateValidCpf();

    const orderRef = typeof externalRef === 'string'
      ? externalRef
      : `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const cleanName = typeof payerName === 'string' && payerName.trim() ? payerName.trim() : 'Doador Patas Vivas';
    const cleanEmail = typeof payerEmail === 'string' && payerEmail.trim() ? payerEmail.trim() : 'doador@patasvivas.org.br';
    const cleanPhone = typeof payerPhone === 'string' ? payerPhone.replace(/\D/g, '') : '11999999999';
    const cleanDesc = typeof description === 'string' && description.trim() ? description.substring(0, 100) : 'Doação Patas Vivas';

    const payload = {
      amount: parsedAmount,
      currency: 'BRL',
      method: 'PIX',
      description: cleanDesc,
      externalRef: orderRef,
      payer: {
        name: cleanName,
        taxId: effectiveTaxId,
        email: cleanEmail,
        phone: cleanPhone || '11999999999',
      },
      items: [
        {
          quantity: 1,
          name: cleanDesc,
          price: parsedAmount,
          type: 'DIGITAL',
        },
      ],
    };

    console.log('[Masterfy API] Creating PIX payment for amount:', parsedAmount);

    const apiResponse = await fetch(MASTERFY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MASTERFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const textResponse = await apiResponse.text();
    let data: any = null;
    try {
      data = JSON.parse(textResponse);
    } catch {
      console.error('[Masterfy API] Create non-JSON response:', apiResponse.status, textResponse.slice(0, 150));
      return res.status(apiResponse.status || 502).json({
        success: false,
        error: 'Resposta inválida do provedor Masterfy. Tente novamente.',
      });
    }

    if (!apiResponse.ok) {
      console.error('[Masterfy API] Error response:', apiResponse.status, data);
      return res.status(apiResponse.status).json({
        success: false,
        error: data?.message || 'Falha ao comunicar com o gateway de pagamento Masterfy.',
        details: data?.details,
      });
    }

    const copypaste = data?.data?.copypaste || '';
    let qrCodeBase64 = '';

    if (copypaste) {
      qrCodeBase64 = await QRCode.toDataURL(copypaste, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    }

    return res.json({
      success: true,
      id: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      copypaste,
      qrCodeBase64,
      description: data.description,
      createdAt: data.createdAt,
      externalRef: data.externalRef,
    });
  } catch (error: any) {
    console.error('[Server] Exception in /api/pix/create:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar pagamento PIX.',
      message: error?.message,
    });
  }
});

/**
 * GET /api/pix/status/:id
 * Checks transaction status on Masterfy Pagamentos API with rate-limit protection & caching
 */
app.get('/api/pix/status/:id', async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'ID do pagamento é obrigatório.' });
    }

    // 1. Check in-memory cache to prevent 429 (Too Many Requests)
    const now = Date.now();
    const cached = statusCache.get(paymentId);
    if (cached && now - cached.timestamp < STATUS_CACHE_TTL_MS) {
      return res.json({
        success: true,
        id: cached.id,
        status: cached.status,
        isPaid: cached.isPaid,
        paidAt: cached.paidAt,
        amount: cached.amount,
        cached: true,
      });
    }

    const statusUrl = `${MASTERFY_API_URL.replace(/\/+$/, '')}/${encodeURIComponent(paymentId)}`;

    const apiResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MASTERFY_API_TOKEN}`,
      },
    });

    const textResponse = await apiResponse.text();

    // 2. Safe parse JSON or handle plain-text 429
    let data: any = null;
    try {
      data = JSON.parse(textResponse);
    } catch {
      if (apiResponse.status === 429) {
        console.warn(`[Masterfy API] 429 Too Many Requests for status check ${paymentId}. Returning last known status.`);
        // Return pending status without failing
        return res.json({
          success: true,
          id: paymentId,
          status: cached?.status || 'PENDING',
          isPaid: cached?.isPaid || false,
          paidAt: cached?.paidAt || null,
          rateLimited: true,
        });
      }

      console.error('[Masterfy API] Status check non-JSON response:', apiResponse.status, textResponse.slice(0, 100));
      return res.json({
        success: true,
        id: paymentId,
        status: cached?.status || 'PENDING',
        isPaid: cached?.isPaid || false,
      });
    }

    if (!apiResponse.ok) {
      console.warn('[Masterfy API] Status check returned non-2xx:', apiResponse.status, data?.message);
      return res.json({
        success: true,
        id: paymentId,
        status: cached?.status || 'PENDING',
        isPaid: cached?.isPaid || false,
      });
    }

    const isPaid = data.status === 'PAID' || data.status === 'APPROVED' || data.status === 'COMPLETED';

    const result: CachedStatus = {
      id: data.id,
      status: data.status,
      isPaid,
      paidAt: data.paidAt,
      amount: data.amount,
      timestamp: now,
    };

    // Update cache
    statusCache.set(paymentId, result);

    return res.json({
      success: true,
      id: result.id,
      status: result.status,
      isPaid: result.isPaid,
      paidAt: result.paidAt,
      amount: result.amount,
    });
  } catch (error: any) {
    console.error('[Server] Exception in /api/pix/status:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao consultar status do PIX.',
    });
  }
});

/**
 * Webhook for asynchronous status notification
 */
app.post('/api/webhook/payment', (req: Request, res: Response) => {
  console.log('[Masterfy Webhook] Received notification:', req.body);
  res.json({ received: true });
});

// Configure Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Patas Vivas] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
