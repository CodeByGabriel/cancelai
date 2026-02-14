/**
 * Auto-registro de todos os bank parsers.
 *
 * Importar este módulo registra todos os parsers no registry.
 * Ordem importa: bancos específicos ANTES do generic (fallback).
 */

// CSV + PDF
import './nubank.parser.js';
import './itau.parser.js';
import './bradesco.parser.js';
import './bb.parser.js';
import './caixa.parser.js';
import './inter.parser.js';
import './santander.parser.js';
import './picpay.parser.js';
import './mercadopago.parser.js';

// CSV-only
import './c6.parser.js';
import './neon.parser.js';
import './original.parser.js';
import './next.parser.js';
import './sofisa.parser.js';
import './agibank.parser.js';
import './sicoob.parser.js';
import './sicredi.parser.js';
import './btg.parser.js';
import './xp.parser.js';

// Fallback (sempre por último)
import './generic.parser.js';
