import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — ShopBox" },
      { name: "description", content: "Termos de Uso da plataforma ShopBox para criação de lojas online." },
      { property: "og:title", content: "Termos de Uso — ShopBox" },
      { property: "og:description", content: "Conheça os termos que regem o uso da plataforma ShopBox." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 text-[15px] leading-relaxed text-neutral-700">
        <h1 className="mb-2 text-3xl font-bold text-neutral-900">Termos de Uso</h1>
        <p className="mb-10 text-sm text-neutral-500">Última atualização: 20 de abril de 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">1. Aceitação dos termos</h2>
          <p>
            Ao criar uma conta na ShopBox ("plataforma", "serviço", "nós"), você ("usuário", "lojista")
            declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a nossa{" "}
            <Link to="/privacidade" className="text-[#00b7a8] underline">Política de Privacidade</Link>.
            Se você não concorda, não utilize a plataforma.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">2. Descrição do serviço</h2>
          <p>
            A ShopBox é uma plataforma SaaS que permite ao lojista criar uma loja online integrada
            ao WhatsApp, cadastrar produtos, receber pedidos, gerir clientes e personalizar a vitrine.
            A plataforma não é parte das transações entre lojista e cliente final.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">3. Cadastro e conta</h2>
          <p>
            Para usar a ShopBox você precisa ter no mínimo 18 anos ou ser pessoa jurídica regularmente
            constituída. Você é responsável pela veracidade dos dados informados e pela segurança da
            sua senha. Notifique-nos imediatamente em caso de uso não autorizado.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">4. Planos, pagamentos e teste grátis</h2>
          <p>
            A ShopBox oferece um período de teste grátis de 7 dias. Após esse período, a assinatura é
            cobrada automaticamente no cartão cadastrado, conforme o plano escolhido (mensal ou anual).
            Os preços vigentes estão disponíveis em <Link to="/precos" className="text-[#00b7a8] underline">/precos</Link>.
          </p>
          <p>
            Os pagamentos são processados pela Stripe. A ShopBox não armazena dados de cartão.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">5. Cancelamento e reembolso</h2>
          <p>
            Você pode cancelar a assinatura a qualquer momento pelo painel da loja. O cancelamento
            interrompe a renovação automática e o acesso permanece ativo até o fim do período já pago.
          </p>
          <p>
            <strong>Não há reembolso de valores já cobrados</strong>, salvo nos casos previstos em lei
            (art. 49 do CDC — direito de arrependimento em até 7 dias da contratação inicial).
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">6. Uso aceitável</h2>
          <p>O lojista compromete-se a não utilizar a ShopBox para:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Comercializar produtos ilegais, falsificados ou que violem direitos de terceiros;</li>
            <li>Praticar fraude, lavagem de dinheiro ou qualquer atividade criminosa;</li>
            <li>Enviar spam, mensagens não solicitadas ou conteúdo enganoso;</li>
            <li>Tentar acessar áreas restritas, decompilar ou explorar vulnerabilidades da plataforma;</li>
            <li>Hospedar conteúdo pornográfico, discriminatório, violento ou ofensivo.</li>
          </ul>
          <p>
            A ShopBox pode suspender ou encerrar contas que descumpram estas regras, sem aviso prévio
            e sem direito a reembolso.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">7. Responsabilidade do lojista</h2>
          <p>
            O lojista é o único responsável pelos produtos vendidos, atendimento, entrega, emissão de
            nota fiscal, cumprimento de obrigações fiscais e tributárias, e relacionamento com os
            clientes finais. A ShopBox apenas fornece a tecnologia.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">8. Propriedade intelectual</h2>
          <p>
            A marca ShopBox, o software, o design, os textos e os ícones são de propriedade exclusiva
            da ShopBox. O lojista mantém a propriedade do conteúdo que publica (logo, fotos, textos
            de produtos), concedendo à ShopBox licença não exclusiva para hospedar e exibir esse
            conteúdo na sua loja.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">9. Limitação de responsabilidade</h2>
          <p>
            A ShopBox empenha-se em manter o serviço disponível 24/7, mas não garante disponibilidade
            ininterrupta. Não nos responsabilizamos por: (i) perdas indiretas; (ii) lucros cessantes;
            (iii) falhas de provedores terceiros (Stripe, WhatsApp, hospedagem); (iv) atos do próprio
            lojista ou de seus clientes.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">10. Alterações dos termos</h2>
          <p>
            Podemos atualizar estes Termos a qualquer momento. Mudanças relevantes serão comunicadas
            por e-mail. O uso continuado da plataforma após a notificação implica aceitação.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">11. Foro</h2>
          <p>
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de
            <strong> São Paulo/SP</strong> para dirimir quaisquer controvérsias, com renúncia a
            qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">12. Contato</h2>
          <p>
            Dúvidas sobre estes Termos? Fale com a gente em{" "}
            <a href="mailto:contato@shopboxapp.com.br" className="text-[#00b7a8] underline">
              contato@shopboxapp.com.br
            </a>.
          </p>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
