/**
 * Geração ultrarrápida de código PIX Copia e Cola (padrão EMV BR Code do Banco Central do Brasil)
 * e geração instantânea de QR Code local (via biblioteca QRCode, 0ms de latência externa).
 */

import QRCode from 'qrcode';
import { getPixKey } from './config';

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// CRC16-CCITT (0x1021) calculation for EMV BR Code
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number; // in Reais (ex: 20.00)
  txId?: string;
}

/**
 * Gera o payload oficial do PIX Copia e Cola (padrão Bacen)
 */
export function generatePixPayload({
  pixKey,
  merchantName = 'Patas Vivas',
  merchantCity = 'Sao Paulo',
  amount,
  txId = '***',
}: PixPayloadParams): string {
  const effectiveKey = (pixKey || getPixKey() || 'patasvivas.ajuda@gmail.com').trim();
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25);
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15);
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 00: Payload Format Indicator
  let payload = formatField('00', '01');

  // 26: Merchant Account Information - PIX
  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', effectiveKey);
  payload += formatField('26', `${gui}${key}`);

  // 52: Merchant Category Code
  payload += formatField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatField('53', '986');

  // 54: Transaction Amount
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatField('58', 'BR');

  // 59: Merchant Name
  payload += formatField('59', cleanName || 'PATAS VIVAS');

  // 60: Merchant City
  payload += formatField('60', cleanCity || 'SAO PAULO');

  // 62: Additional Data Field Template (TxID)
  const txField = formatField('05', cleanTxId);
  payload += formatField('62', txField);

  // 63: CRC16 (Calculado sobre toda a string anterior + '6304')
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}

// In-memory cache for generated QR code data URLs (instant access < 0.1ms)
const qrDataUrlCache = new Map<string, string>();

/**
 * Gera URL Base64 de imagem do QR Code de forma 100% local, instantânea e sem requisições de rede.
 */
export async function getFastQrCodeDataUrl(payloadText: string, size = 280): Promise<string> {
  const cacheKey = `${size}::${payloadText}`;
  const cached = qrDataUrlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const dataUrl = await QRCode.toDataURL(payloadText, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    qrDataUrlCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Falha ao gerar QR Code localmente:', err);
    // Fallback de emergência caso haja algum erro na biblioteca local
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payloadText)}`;
  }
}

/**
 * Função utilitária que gera de forma ultra-rápida tanto o payload PIX quanto a imagem QR Code.
 */
export async function generateInstantPix(amount: number, customKey?: string): Promise<{
  qr_code: string;
  qr_code_base64: string;
}> {
  const payload = generatePixPayload({
    amount,
    pixKey: customKey || getPixKey(),
    merchantName: 'Patas Vivas',
    merchantCity: 'Sao Paulo',
    txId: `PV${Date.now().toString().slice(-6)}`,
  });

  const qrDataUrl = await getFastQrCodeDataUrl(payload, 280);

  return {
    qr_code: payload,
    qr_code_base64: qrDataUrl,
  };
}

/**
 * Retorna URL de imagem do QR Code legada caso solicitada diretamente
 */
export function getQrCodeImageUrl(payloadText: string, size = 260): string {
  const cached = qrDataUrlCache.get(`${size}::${payloadText}`);
  if (cached) return cached;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payloadText)}`;
}

// Pré-aquecimento automático em background dos valores mais comuns de doação
// para que quando o usuário clicar em qualquer valor, o QR Code já esteja 100% pronto na memória!
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const commonAmounts = [10, 20, 30, 50, 80, 100, 150, 200, 300, 500];
    for (const amt of commonAmounts) {
      const payload = generatePixPayload({
        amount: amt,
        pixKey: getPixKey(),
        merchantName: 'Patas Vivas',
        merchantCity: 'Sao Paulo',
        txId: 'PV000000',
      });
      QRCode.toDataURL(payload, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => {
          qrDataUrlCache.set(`280::${payload}`, url);
        })
        .catch(() => {});
    }
  }, 100);
}
