import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacidade',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-6 py-12">
      <div class="mx-auto max-w-3xl">
        <a routerLink="/" class="text-sm text-ink-muted hover:text-brand-primary">← Voltar</a>

        <h1 class="text-3xl font-bold text-ink mt-6">Política de Privacidade</h1>
        <p class="text-sm text-ink-muted mt-2">Última atualização: 11/04/2026</p>

        <div class="mt-8 prose prose-sm max-w-none text-ink">
          <p>
            A cvPERFEITO respeita a sua privacidade e está comprometida com a proteção dos seus
            dados pessoais, conforme a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">1. Dados Coletados</h2>
          <p>Podemos coletar os seguintes dados:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Dados cadastrais (nome, e-mail, etc.)</li>
            <li>Informações de login</li>
            <li>Currículos e documentos enviados</li>
            <li>Dados de navegação (cookies, IP, dispositivo)</li>
          </ul>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">2. Finalidade do Uso dos Dados</h2>
          <p>Seus dados são utilizados para:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Fornecer e melhorar nossos serviços</li>
            <li>Realizar análises automatizadas de currículos</li>
            <li>Personalizar a experiência do usuário</li>
            <li>Cumprir obrigações legais</li>
          </ul>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">3. Uso de Inteligência Artificial</h2>
          <p>
            A plataforma utiliza sistemas automatizados e inteligência artificial para analisar,
            sugerir melhorias e otimizar currículos. Essas decisões não possuem caráter exclusivamente
            decisório e podem exigir revisão humana.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">4. Compartilhamento de Dados</h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Prestadores de serviço (ex: hospedagem, infraestrutura)</li>
            <li>Autoridades legais, quando necessário</li>
          </ul>
          <p class="mt-2 font-semibold">Não vendemos seus dados pessoais.</p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">5. Armazenamento e Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos
            não autorizados, perda ou alteração.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">6. Direitos do Titular (LGPD)</h2>
          <p>Você pode, a qualquer momento:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li>Solicitar acesso aos seus dados</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar exclusão dos dados</li>
            <li>Revogar o consentimento</li>
          </ul>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">7. Cookies</h2>
          <p>
            Utilizamos cookies para melhorar a experiência do usuário. Você pode gerenciar
            suas preferências no navegador.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">8. Retenção de Dados</h2>
          <p>
            Os dados serão armazenados pelo tempo necessário para cumprir as finalidades
            descritas, respeitando obrigações legais.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">9. Alterações nesta Política</h2>
          <p>
            Esta política pode ser atualizada periodicamente.
          </p>

          <h2 class="text-lg font-semibold text-ink mt-8 mb-3">10. Contato</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas, entre em contato:
            <a href="mailto:cvperfeitocontato@gmail.com" class="text-brand-primary underline">
              cvperfeitocontato&#64;gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  `,
})
export class PrivacidadeComponent {}