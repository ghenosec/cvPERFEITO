import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-3xl">
        <a routerLink="/" class="text-sm text-ink-muted hover:text-brand-primary">← Voltar</a>

        <h1 class="text-3xl font-bold text-ink mt-6">Termos de Uso</h1>
        <p class="text-sm text-ink-muted mt-2">Última atualização: 11/04/2026</p>

        <div class="mt-8 prose prose-sm max-w-none text-ink">
          <p>
            Bem-vindo à plataforma cvPERFEITO. Ao acessar ou utilizar nossos serviços,
            você concorda com os presentes Termos de Uso.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao utilizar a plataforma, o usuário declara que leu, compreendeu e concorda com
            estes Termos de Uso e com a Política de Privacidade.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">2. Descrição do Serviço</h2>
          <p>
            A cvPERFEITO é uma plataforma digital que oferece serviços de análise, otimização
            e aprimoramento de currículos, incluindo o uso de inteligência artificial para
            recomendações e melhorias.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">3. Cadastro e Conta</h2>
          <p>
            Para acessar determinadas funcionalidades, o usuário poderá precisar criar uma conta,
            fornecendo informações verdadeiras, completas e atualizadas. O usuário é responsável
            por manter a confidencialidade de suas credenciais de acesso.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">4. Uso da Plataforma</h2>
          <p>O usuário se compromete a:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Utilizar a plataforma de forma lícita</li>
            <li>Não enviar conteúdos ilegais, ofensivos ou que violem direitos de terceiros</li>
            <li>Não tentar explorar falhas ou vulnerabilidades do sistema</li>
          </ul>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">5. Conteúdo do Usuário</h2>
          <p>
            O usuário é responsável pelos dados e documentos enviados, incluindo currículos.
            Ao enviar conteúdo, o usuário autoriza seu processamento pela plataforma, inclusive
            por sistemas automatizados.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">6. Propriedade Intelectual</h2>
          <p>
            Todos os direitos relacionados à plataforma, incluindo código, design, marca e
            funcionalidades, pertencem à cvPERFEITO, sendo proibida sua reprodução sem autorização.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">7. Limitação de Responsabilidade</h2>
          <p>
            A plataforma não garante resultados específicos, como aprovação em processos seletivos.
            A cvPERFEITO não se responsabiliza por decisões tomadas com base nas análises fornecidas.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">8. Suspensão e Cancelamento</h2>
          <p>
            A conta do usuário pode ser suspensa ou encerrada em caso de violação destes termos.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">9. Modificações</h2>
          <p>
            Estes termos podem ser atualizados a qualquer momento, sendo responsabilidade do
            usuário consultá-los periodicamente.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">10. Legislação Aplicável</h2>
          <p>
            Este documento é regido pelas leis da República Federativa do Brasil.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">11. Contato</h2>
          <p>
            Para dúvidas ou solicitações, entre em contato pelo e-mail:
            <a href="mailto:cvperfeitocontato@gmail.com" class="text-brand-primary underline">
              cvperfeitocontato&#64;gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class TermosComponent {}