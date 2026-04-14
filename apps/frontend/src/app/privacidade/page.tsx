import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidade | Cancelai',
  description: 'Politica de privacidade e protecao de dados do Cancelai',
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Politica de Privacidade</h1>
      <p className="text-sm text-foreground-muted mb-8">Ultima atualizacao: Abril 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Dados Coletados</h2>
          <p>O Cancelai processa <strong>exclusivamente</strong> os arquivos de extrato bancario que voce envia voluntariamente (PDF, CSV ou OFX). Os dados extraidos incluem:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Descricao do estabelecimento/servico</li>
            <li>Valor da transacao</li>
            <li>Data da transacao</li>
            <li>Tipo (debito/credito)</li>
          </ul>
          <p><strong>NAO coletamos:</strong> nome, CPF, numero de conta, saldo, endereco, email ou qualquer outro dado pessoal identificavel.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Como Processamos</h2>
          <p>Todos os dados sao processados <strong>inteiramente em memoria</strong> (RAM) do servidor. Os arquivos enviados sao:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Recebidos em memoria (nunca salvos em disco)</li>
            <li>Analisados pelo algoritmo de deteccao de assinaturas</li>
            <li>Zerados (preenchidos com zeros) apos processamento</li>
            <li>Descartados pelo coletor de lixo (garbage collector)</li>
          </ol>
          <p><strong>Nenhum dado e armazenado, persistido em banco de dados, ou mantido apos o processamento.</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Base Legal (LGPD Art. 7)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Parsing de extrato:</strong> Execucao de contrato (Art. 7, V) — voce solicita o servico ao enviar o arquivo</li>
            <li><strong>Deteccao de assinaturas:</strong> Consentimento (Art. 7, I) — voce consente ao usar o servico</li>
            <li><strong>Classificacao por IA (opcional):</strong> Consentimento (Art. 7, I) — quando a API DeepSeek e usada para classificar transacoes ambiguas, apenas descricoes normalizadas (sem PII) sao enviadas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Transferencia Internacional</h2>
          <p>Quando a classificacao por IA esta ativada, descricoes de transacoes normalizadas (sem dados pessoais) podem ser enviadas para a API da DeepSeek (sediada na China) para classificacao. Apenas informacoes como &quot;NETFLIX&quot;, &quot;SPOTIFY&quot; sao transmitidas — nunca dados financeiros ou pessoais.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Retencao de Dados</h2>
          <p>O Cancelai opera com <strong>politica de retencao zero</strong>:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados sao processados e descartados em segundos</li>
            <li>Nao ha banco de dados, cache, ou logs com dados financeiros</li>
            <li>Buffers de memoria sao explicitamente zerados apos uso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Seus Direitos (LGPD Art. 18)</h2>
          <p>Como titular dos dados, voce tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Confirmacao:</strong> Confirmar que seus dados foram processados</li>
            <li><strong>Acesso:</strong> Acessar os dados processados (disponivel na tela de resultados)</li>
            <li><strong>Eliminacao:</strong> Solicitar eliminacao — na pratica, os dados ja sao eliminados automaticamente</li>
            <li><strong>Revogacao:</strong> Revogar consentimento a qualquer momento (os dados ja terao sido descartados)</li>
            <li><strong>Portabilidade:</strong> Os resultados sao exibidos em tela e podem ser copiados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookies e Rastreamento</h2>
          <p>O Cancelai <strong>nao utiliza cookies, trackers, analytics ou qualquer forma de rastreamento</strong>. Nao ha Google Analytics, Facebook Pixel, ou similares.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Seguranca</h2>
          <p>Medidas de seguranca implementadas:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>HTTPS com certificado SSL/TLS</li>
            <li>Headers de seguranca (Helmet: CSP, X-Frame-Options, etc.)</li>
            <li>Rate limiting por IP para prevenir abuso</li>
            <li>Validacao de tipo e tamanho de arquivo</li>
            <li>Sanitizacao de nomes de arquivo</li>
            <li>Processamento exclusivo em memoria</li>
            <li>Zero persistencia de dados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
          <p>Para exercer seus direitos como titular de dados ou para duvidas sobre esta politica, entre em contato pelo repositorio do projeto no GitHub.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <a href="/" className="text-primary hover:underline">&larr; Voltar ao inicio</a>
      </div>
    </main>
  );
}
