import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não! Você cria sua conta grátis e tem 7 dias para testar todos os recursos do plano escolhido. Só cobramos depois.",
  },
  {
    q: "Como funciona o checkout pelo WhatsApp?",
    a: "Seu cliente monta o carrinho na loja e ao finalizar é direcionado para uma conversa no seu WhatsApp já com todos os itens, variações, cupom aplicado e total — você confirma pagamento e entrega.",
  },
  {
    q: "Posso usar meu próprio domínio?",
    a: "Sim, no plano Premium você conecta seu domínio (sualoja.com.br). Nos outros planos você usa o subdomínio gratuito da plataforma.",
  },
  {
    q: "Tem limite de produtos?",
    a: "O plano Inicial permite até 50 produtos. Profissional e Premium são ilimitados.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim, a qualquer momento. Upgrade ou downgrade direto no painel administrativo.",
  },
  {
    q: "E se eu quiser cancelar?",
    a: "Sem multa, sem burocracia. Cancela quando quiser direto pelo painel.",
  },
  {
    q: "Vocês cobram comissão por venda?",
    a: "Não. Você paga só a mensalidade do plano e fica com 100% das suas vendas.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQ.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`} className="border-b border-[#e5e7eb]">
          <AccordionTrigger className="py-5 text-left text-base font-semibold text-[#111827] hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm text-[#6b7280]">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
