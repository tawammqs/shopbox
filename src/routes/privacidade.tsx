import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — ShopBox" },
      { name: "description", content: "Como a ShopBox coleta, usa e protege seus dados pessoais — em conformidade com a LGPD." },
      { property: "og:title", content: "Política de Privacidade — ShopBox" },
      { property: "og:description", content: "Transparência total sobre o tratamento de dados na ShopBox." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 text-[15px] leading-relaxed text-neutral-700">
        <h1 className="mb-2 text-3xl font-bold text-neutral-900">Política de Privacidade</h1>
        <p className="mb-10 text-sm text-neutral-500">Última atualização: 20 de abril de 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">1. Quem somos</h2>
          <p>
            A ShopBox é uma plataforma SaaS para criação de lojas online integradas ao WhatsApp.
            Esta Política descreve como tratamos os dados pessoais dos lojistas e dos consumidores
            finais que acessam as lojas hospedadas na plataforma, em conformidade com a Lei Geral
            de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">2. Dados que coletamos</h2>
          <p><strong>Do lojista:</strong></p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Nome, e-mail, senha (hash);</li>
            <li>Nome da loja, segmento, WhatsApp, redes sociais;</li>
            <li>Dados de cobrança (processados pela Stripe — não armazenamos cartão);</li>
            <li>Logs de acesso, IP, navegador.</li>
          </ul>
          <p><strong>Do consumidor final (quando faz um pedido na loja do lojista):</strong></p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Nome, WhatsApp, e-mail (opcional), CPF (opcional);</li>
            <li>Endereço de entrega;</li>
            <li>Histórico de pedidos.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">3. Para que usamos seus dados</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Operar a plataforma e prestar o serviço contratado;</li>
            <li>Processar pagamentos e renovações de assinatura;</li>
            <li>Enviar comunicações transacionais (boas-vindas, confirmações, recuperação de senha);</li>
            <li>Garantir segurança, prevenir fraude e cumprir obrigações legais;</li>
            <li>Melhorar a plataforma com base em métricas agregadas.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">4. Base legal (LGPD)</h2>
          <p>Tratamos dados com base em:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Execução de contrato</strong> (art. 7º, V) — para prestar o serviço;</li>
            <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II) — fiscal e tributária;</li>
            <li><strong>Legítimo interesse</strong> (art. 7º, IX) — segurança e melhoria do serviço;</li>
            <li><strong>Consentimento</strong> (art. 7º, I) — quando aplicável (ex: cookies analíticos).</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">5. Compartilhamento</h2>
          <p>Compartilhamos dados apenas com fornecedores essenciais à operação:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Stripe</strong> — processamento de pagamentos;</li>
            <li><strong>Supabase / Cloudflare</strong> — hospedagem e banco de dados;</li>
            <li><strong>Mailgun</strong> — envio de e-mails transacionais;</li>
            <li>Autoridades, quando exigido por lei.</li>
          </ul>
          <p>Não vendemos seus dados a terceiros.</p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">6. Cookies</h2>
          <p>
            Usamos cookies essenciais (sessão, autenticação) e cookies de medição (para entender o
            uso da plataforma). Você pode desabilitar cookies no seu navegador, mas isso pode
            comprometer o funcionamento da plataforma.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">7. Retenção</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, dados de
            faturamento são retidos por 5 anos (obrigação fiscal). Os demais dados são excluídos
            ou anonimizados em até 90 dias, salvo se houver obrigação legal de retenção.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">8. Seus direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos seus dados;</li>
            <li>Correção de dados incompletos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Portabilidade;</li>
            <li>Eliminação dos dados tratados com seu consentimento;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer seus direitos, escreva para{" "}
            <a href="mailto:privacidade@shopboxapp.com.br" className="text-[#00b7a8] underline">
              privacidade@shopboxapp.com.br
            </a>.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">9. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em
            trânsito (HTTPS), senhas armazenadas com hash, controle de acesso baseado em papéis
            (RLS), backups periódicos. Apesar disso, nenhum sistema é 100% imune.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">10. Encarregado (DPO)</h2>
          <p>
            Em caso de dúvidas sobre o tratamento de dados pessoais, fale com nosso encarregado:{" "}
            <a href="mailto:privacidade@shopboxapp.com.br" className="text-[#00b7a8] underline">
              privacidade@shopboxapp.com.br
            </a>.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">11. Alterações</h2>
          <p>
            Podemos atualizar esta Política. Mudanças relevantes serão comunicadas por e-mail. A
            data da última atualização está sempre no topo deste documento.
          </p>
        </section>

        <p className="mt-10 text-sm text-neutral-500">
          Veja também os{" "}
          <Link to="/termos" className="text-[#00b7a8] underline">Termos de Uso</Link>.
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
