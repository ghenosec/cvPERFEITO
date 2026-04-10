# cvPERFEITO

> SaaS de otimização de currículos com análise por múltiplas IAs especializadas, score ATS e carta de apresentação automática.

![Stack](https://img.shields.io/badge/stack-NestJS%20%2B%20Angular%2017-C1121F)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Sobre o projeto

cvPERFEITO é uma plataforma que utiliza **5 IAs especializadas** trabalhando em paralelo para analisar e otimizar currículos, aumentando as chances de aprovação em sistemas ATS (Applicant Tracking System) e impressionando recrutadores. O usuário envia o currículo em PDF ou DOCX e recebe análise completa, reescrita profissional, carta de apresentação personalizada e muito mais.

## As 5 IAs especializadas

Cada IA tem um papel específico e as chamadas são feitas em paralelo para reduzir o tempo de análise.

- **ATS Analyzer** — Gera score de 0-100, identifica palavras-chave ausentes e detecta problemas de formatação que prejudicam a leitura automática por sistemas de recrutamento
- **Resume Writer** — Reescreve o currículo em tom profissional, corrigindo gramática e transformando frases genéricas em conquistas orientadas a resultados com métricas
- **Recruiter Vision** — Simula a leitura de um recrutador sênior, apontando pontos fortes, fracos e informações confusas
- **Market Match** — Compara o currículo com a descrição de uma vaga específica, gerando score de compatibilidade e palavras-chave faltantes
- **Innovation AI** — Sugere headline profissional, resumo pessoal otimizado, skills em alta e versão para LinkedIn

## Funcionalidades principais

- Upload de PDF e DOCX com extração automática de texto
- Análise completa com as 5 IAs em paralelo
- Download do currículo otimizado em **PDF** e **DOCX** editável
- Carta de apresentação personalizada gerada por IA
- **Versão em inglês** gerada automaticamente (plano Premium)
- Versionamento automático de cada análise
- Comparação lado a lado antes vs depois
- Link público compartilhável
- Preview do currículo antes do download
- Histórico completo de análises
- Sistema de créditos pay-per-use

## Modelo de negócio

Plataforma freemium com três planos pay-per-use (sem mensalidades, compra única via PIX).

| Plano | Preço | Análises | Recursos |
|-------|-------|----------|----------|
| **Gratuito** | R$ 0 | 1 | Score ATS + visão do recrutador |
| **Básico** | R$ 4,90 | 5 | + Download PDF/DOCX, carta de apresentação, histórico |
| **Premium** | R$ 9,90 | 15 | + Match com vaga, versão em inglês, evolução de score |

O plano gratuito permite 1 análise completa com visualização do score ATS e feedback do recrutador, mas o currículo reescrito aparece com blur — estratégia de conversão que permite o usuário experimentar o valor antes de pagar.

## Stack técnica

**Backend**
- NestJS 10 + TypeScript
- Prisma ORM + PostgreSQL
- JWT para autenticação
- OpenAI API (gpt-4o-mini)
- AbacatePay para pagamentos PIX
- pdfkit + docx para geração de arquivos profissionais

**Frontend**
- Angular 17 com standalone components
- Angular Signals para estado reativo
- TailwindCSS
- ng-icons (Heroicons)
- RxJS

## Destaques de implementação

- **Orquestração de IA em paralelo** — As 5 chamadas ao OpenAI são disparadas simultaneamente com `Promise.all`, reduzindo o tempo de análise de ~60s para ~15-20s
- **Geração de PDF profissional** — Layout fiel a templates premium de currículo, construído programaticamente com pdfkit (sem depender de HTML-to-PDF)
- **Geração de DOCX editável** — Documentos Word nativos com formatação correta, bordas de seção, hierarquia tipográfica e suporte a edição posterior
- **Feature gating por plano** — Sistema central de configuração de planos (`plans.config.ts`) define features disponíveis; backend e frontend consultam a mesma fonte de verdade
- **Preview com blur progressivo** — Usuários do plano gratuito veem nome e resumo nítidos, mas experiência/formação/habilidades aparecem borradas com overlay de upgrade — padrão clássico de conversão freemium
- **Integração AbacatePay completa** — Geração de QR Code PIX, polling de status, webhook para confirmação assíncrona e endpoint de simulação para testes em desenvolvimento
- **Versionamento automático** — Cada análise gera uma nova versão do currículo, permitindo comparação e histórico completo
- **Extração inteligente de contato** — A IA extrai nome, email, telefone e localização diretamente do currículo original; se algum campo estiver ausente, faz fallback para os dados da conta

## Identidade visual

Paleta inspirada em templates premium de currículo: branco predominante com vermelho elegante usado apenas em CTAs, badges e destaques importantes.

| Cor | Hex | Uso |
|-----|-----|-----|
| Vermelho primário | `#C1121F` | CTAs, destaques, score ATS |
| Vermelho secundário | `#E63946` | Hover, gradientes |
| Branco | `#FFFFFF` | Fundo principal, cards |
| Cinza claro | `#F8F8F8` | Fundo secundário |
| Preto texto | `#111827` | Texto principal |
| Cinza texto | `#6B7280` | Texto secundário |

Design inspirado em Notion, Linear e Stripe — minimalista, bordas arredondadas, cards elegantes, tipografia forte e animações suaves.

## Roadmap

- [x] Autenticação JWT
- [x] Análise com 5 IAs em paralelo
- [x] Geração de PDF e DOCX profissionais
- [x] Versionamento de currículos
- [x] Comparação lado a lado
- [x] Integração AbacatePay (PIX)
- [x] Sistema de planos (Free/Básico/Premium)
- [x] Carta de apresentação com IA
- [x] Versão em inglês automática
- [x] Link público compartilhável
- [x] Preview bloqueado com blur no plano gratuito
- [ ] Testes E2E
- [ ] Landing page pública
- [ ] Gráfico de evolução do ATS score
- [ ] Múltiplos templates de PDF
- [ ] Análise específica por área (Tech, Marketing, Financeiro)

## Licença
   
   Este projeto está licenciado sob a MIT License — veja o arquivo [LICENSE](LICENSE) para detalhes.
   
   Copyright (c) 2026 Ghenosec

---