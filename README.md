# ValiFood

**Mais controle. Menos desperdício.**

O ValiFood é um aplicativo móvel que ajuda você a nunca mais perder o prazo de
validade dos produtos que compra. O fluxo central é simples:

> **escanear → identificar → informar validade → ser lembrado**

## O que é e qual problema resolve

Todo mundo já jogou fora leite, iogurte, frango ou remédio que venceu esquecido
no fundo da geladeira ou da despensa. Segundo estimativas do setor, boa parte do
desperdício doméstico de alimentos vem justamente de produtos que vencem antes
do consumo.

O ValiFood resolve isso com três passos:

1. **Escaneie o código de barras** do produto — o app identifica nome e foto
   automaticamente (com cadastro manual como alternativa quando a base pública
   não conhece o código);
2. **Informe a validade** e a frequência com que quer ser lembrado;
3. **Receba os lembretes** no celular — notificações locais agendadas no próprio
   aparelho, que funcionam **offline** e continuam valendo com o app fechado.

Além disso, o app mantém um **estoque** do que você tem em casa (ordenado pelo
que vence primeiro, com cores verde/amarelo/vermelho) e um **histórico** do que
foi consumido ou descartado — ou seja, quanto desperdício você deixou de gerar.

## Propósito e casos de uso

**Propósito:** reduzir o desperdício de alimentos e dinheiro, dando a qualquer
pessoa um controle simples do que vence quando — sem planilhas, sem cadastro em
servidor, sem internet obrigatória.

Casos de uso concretos:

- **Família no dia a dia:** depois das compras do mês, Ana escaneia leite,
  iogurte, frios e arroz. No domingo o app avisa "iogurte vence em 3 dias" e ela
  consome antes de estragar. Em um mês, nada venceu esquecido na geladeira.
- **Estudante com orçamento apertado:** Carlos cadastra o que compra e usa o
  histórico para ver que parou de perder comida — economia direta no fim do mês.
- **Padaria / lanchonete de bairro:** o responsável pelo estoque escaneia
  requeijão, presunto e ovos e recebe alerta 2 dias antes do vencimento,
  reposicionando os itens para promoção em vez de descartar.
- **Mercadinho de bairro:** com o estoque ordenado por vencimento, o operador
  confere pela manhã o que precisa ser vendido primeiro, reduzindo perdas de
  perecíveis.
- **Casa com medicamentos e higiene:** além de alimentos, produtos de higiene e
  limpeza com prazo (pomadas, desinfetante) entram pelo cadastro manual.

Em todos os casos, os dados ficam **no aparelho** (ver [LGPD](#privacidade-e-lgpd)),
não é preciso criar conta em servidor e o app funciona sem internet.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.86 + **Expo SDK 57** + TypeScript estrito |
| Navegação | `@react-navigation/native-stack` + `bottom-tabs` |
| Scanner | `expo-camera` (`CameraView` + `onBarcodeScanned`) |
| Notificações | `expo-notifications` — **notificações locais agendadas** (sem servidor de push) |
| Persistência | `expo-sqlite` (local-first, migrações por `PRAGMA user_version`) |
| Estado | `zustand` |
| API de produtos | Open Food Facts (gratuita) + Cosmos Bluesoft (fallback opcional, requer token) |
| UI | Componentes próprios + `@expo/vector-icons` + `react-native-svg` (logo) + `@expo-google-fonts/inter` |
| Build/CI | EAS Build (`eas.json`), testes com `tsx --test`, TypeScript `tsc --noEmit` |

**Backend:** a v1 é 100% local-first. A única chamada externa é a
consulta do código de barras às APIs públicas de produtos.

## Privacidade e LGPD

O ValiFood v1 foi desenhado para coletar o mínimo necessário — e praticamente
nada sai do aparelho.

| Dado | Onde fica | Sai do aparelho? |
|---|---|---|
| Nome do usuário | SQLite local (`settings`) | Não |
| Produtos, validades e histórico | SQLite local | Não |
| Preferências e flags (onboarding etc.) | SQLite local | Não |
| Código de barras lido | Enviado **apenas o número** na consulta | Sim, para Open Food Facts (e Cosmos, se configurado) |

- **Sem servidor próprio, sem conta na nuvem, sem analytics.** Desinstalar o app
  apaga tudo definitivamente.
- **Permissões usadas e por quê:** câmera (ler código de barras / fotografar o
  produto), notificações (avisar da validade), galeria (só se você escolher uma
  foto). Nenhuma permissão de localização ou contatos.
- **Consulta externa:** ao escanear um código desconhecido, apenas o número do
  GTIN é enviado ao Open Food Facts com um `User-Agent` que identifica o app
  (política da API). Nada de dados pessoais é enviado.
- **Direitos do titular:** como não há cadastro em servidor, os direitos de
  acesso/eliminação se exercitam no próprio aparelho — "Configurações → Limpar
  todo o estoque" remove produtos e cancela todos os lembretes, e desinstalar o
  app elimina o banco local.
- **Crianças e dados sensíveis:** o app não coleta dados sensíveis nem é
  direcionado a crianças.

## Como contribuir

### Pré-requisitos

- **Node.js 20+** (LTS recomendado) e npm
- **Conta Expo** (grátis) — para `eas init`, development build e builds na nuvem
- Para build local no Android: **Android Studio** (SDK + emulador); para iOS: macOS com **Xcode**
- Celular com o **Expo Go** (testes rápidos) ou um **development build** (testes de notificação)

### Configurando o ambiente

```bash
git clone <url-do-repositorio>
cd valifood
npm install

# (opcional) token do fallback Cosmos Bluesoft
cp .env.example .env
# EXPO_PUBLIC_COSMOS_TOKEN=seu_token

# vincular o projeto à sua conta Expo (gera o projectId no app.json)
npx eas init

# rodar em desenvolvimento
npm start                 # escaneie o QR com o Expo Go ou com o dev build
npm run android           # ou npm run ios / npm run web

# verificar antes de abrir PR
npm run verify            # tsc --noEmit + testes unitários
```

### Regras de colaboração

- **Branches:** trabalhe em branches a partir da `main`:
  `feat/nome-da-funcionalidade`, `fix/descricao-do-bug`, `docs/tema`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/),
  com a mensagem sempre **em inglês** (padrão do projeto), no formato
  `tipo(escopo): descrição curta` — ex.:
  `feat(stock): add category filter`, `fix(product-form): reject past expiration date`,
  `docs: update the build guide`. Tipos usados: `feat`, `fix`, `docs`, `refactor`,
  `test`, `chore`.
- **Pull Requests:** descreva o **o quê** e o **por quê**; referencie issues
  (`Closes #12`); garanta que `npm run verify` passa e descreva como testar.
  PRs só são mergeados com typecheck e testes verdes.
- **Estilo de código:** TypeScript estrito, componentes funcionais, lógica de
  negócio em módulos puros (`utils/`, `services/*Planner/Lookup`) com testes.

### Testes

```bash
npm test        # 54 testes (tsx --test)
npm run verify  # typecheck + testes
node tools/generate-assets.mjs   # regenera ícones/splash a partir da geometria do logo
npx expo export --platform android   # valida o bundle de produção
```

## Roadmap pós-v1

- OCR da validade impressa (ML Kit Text Recognition).
- Histórico de desperdício como insight/gamificação (a base já está no histórico).
- Backend leve (Supabase) para sincronizar dispositivos entre eles.
- Sugestões de receitas para produtos perto do vencimento.