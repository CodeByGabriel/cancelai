import { describe, test, expect } from 'vitest';
import mercadopagoParser from './mercadopago.parser.js';

// Synthetic text representing what pdfjs-dist (with CMap) extracts from a
// Mercado Pago Visa credit card statement. Tests validate the parsing logic
// independently from the PDF extraction layer.
const SAMPLE_PDF_TEXT = `
Mercado Pago
Cartão Visa [****0715]

Detalhes de consumo

Movimentações na fatura
Data  Estabelecimento  Valor

08/04  DM*hostingercombr  R$ 69,99
08/04  Compra internacional em CLAUDE.AI SUBSCRIPTION  R$ 569,25
USD 100 = R$ 569,25
15/04  MP*MELIMAIS  R$ 9,90
15/04  Compra internacional em AmazonPrimeBR  R$ 19,90
20/04  X CORP. PAID FEATURES  R$ 28,98
20/04  Compra internacional em RAILWAY  R$ 18,32
21/04  WWW-CASASBAHIA-COM-BR Parcela 8 de 10  R$ 253,22
28/04  MAGALU*Magalu Parcela 3 de 3  R$ 127,93

Pagamento da fatura  R$ 1.520,00
Crédito concedido  R$ 200,00
Juros do rotativo  R$ 12,50
IOF do rotativo  R$ 0,43
`.trim();

const OPTIONS = { format: 'pdf' as const, filename: 'fatura-abr2026.pdf' };
const META = { filename: 'fatura-abr2026.pdf', mimetype: 'application/pdf', format: 'pdf' as const, size: 1000 };

describe('Mercado Pago PDF Parser', () => {
  test('canParse retorna true para conteúdo com "Mercado Pago"', () => {
    expect(mercadopagoParser.canParse(SAMPLE_PDF_TEXT, META)).toBe(true);
  });

  test('canParse retorna false para PDF de outro banco', () => {
    expect(mercadopagoParser.canParse('Nubank extrato mensal', META)).toBe(false);
  });

  test('extrai transações básicas corretamente', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.length).toBeGreaterThan(0);
  });

  test('detecta Hostinger (DM*hostingercombr)', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const hostinger = txs.find((t) => t.description.toLowerCase().includes('hostinger'));
    expect(hostinger).toBeDefined();
    expect(hostinger!.amount).toBeCloseTo(69.99, 1);
    expect(hostinger!.type).toBe('debit');
  });

  test('detecta Claude.AI — strip "Compra internacional em"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const claude = txs.find((t) => t.description.toUpperCase().includes('CLAUDE'));
    expect(claude).toBeDefined();
    expect(claude!.amount).toBeCloseTo(569.25, 1);
    expect(claude!.description.toLowerCase()).not.toContain('compra internacional');
  });

  test('detecta MP*MELIMAIS', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const meli = txs.find((t) => t.description.toUpperCase().includes('MELIMAIS'));
    expect(meli).toBeDefined();
    expect(meli!.amount).toBeCloseTo(9.9, 1);
  });

  test('detecta AmazonPrimeBR', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const amazon = txs.find((t) => t.description.toLowerCase().includes('amazon'));
    expect(amazon).toBeDefined();
    expect(amazon!.amount).toBeCloseTo(19.9, 1);
  });

  test('detecta X CORP. PAID FEATURES', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const xcorp = txs.find((t) => t.description.toUpperCase().includes('X CORP'));
    expect(xcorp).toBeDefined();
    expect(xcorp!.amount).toBeCloseTo(28.98, 1);
  });

  test('detecta RAILWAY', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const railway = txs.find((t) => t.description.toUpperCase().includes('RAILWAY'));
    expect(railway).toBeDefined();
    expect(railway!.amount).toBeCloseTo(18.32, 1);
  });

  test('inclui parcelas (para separação pela normalization-stage)', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    const casasBahia = txs.find((t) =>
      t.description.toUpperCase().includes('CASASBAHIA') ||
      t.description.toUpperCase().includes('BAHIA'),
    );
    expect(casasBahia).toBeDefined();
    expect(casasBahia!.description).toMatch(/Parcela/i);
  });

  test('filtra "Pagamento da fatura"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !t.description.toLowerCase().includes('pagamento da fatura'))).toBe(true);
  });

  test('filtra "Crédito concedido"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !t.description.toLowerCase().includes('crédito concedido'))).toBe(true);
  });

  test('filtra "Juros do rotativo"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !t.description.toLowerCase().includes('juros do rotativo'))).toBe(true);
  });

  test('filtra "IOF do rotativo"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !t.description.toLowerCase().includes('iof do rotativo'))).toBe(true);
  });

  test('filtra header "Detalhes de consumo"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !t.description.toLowerCase().includes('detalhes de consumo'))).toBe(true);
  });

  test('filtra header "Cartão Visa"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !/cart[aã]o\s*visa/i.test(t.description))).toBe(true);
  });

  test('filtra "Movimentações na fatura"', async () => {
    const txs = await mercadopagoParser.parse(SAMPLE_PDF_TEXT, OPTIONS);
    expect(txs.every((t) => !/movimenta/i.test(t.description))).toBe(true);
  });
});
