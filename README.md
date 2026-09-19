# ValiFood

**Mais controle. Menos desperdício.**

App mobile (React Native + Expo) que evita que produtos comprados no supermercado
vençam esquecidos na despensa. Fluxo central:

> **escanear → identificar → informar validade → ser lembrado**

Implementação da especificação técnica v1 (`valifood-spec.md`) seguindo o design
de referência (12 telas + paleta + tipografia Inter).

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.86 + **Expo SDK 57** + TypeScript estrito |
| Navegação | `@react-navigation/native-stack` + `bottom-tabs` |
| Scanner | `expo-camera` (`CameraView` + `onBarcodeScanned`) — `expo-barcode-scanner` foi removido no SDK 52 |
| Notificações | `expo-notifications` (**notificações locais agendadas**, sem servidor de push) |
| Persistência | `expo-sqlite` (local-first, migrações por `PRAGMA user_version`) |
| Estado | `zustand` |
| API de produtos | Open Food Facts (primária) + Cosmos Bluesoft (fallback opcional) |
| UI | Componentes próprios + `@expo/vector-icons` + `react-native-svg` (logo) + `@expo-google-fonts/inter` |

## 2. Como rodar

```bash
npm install
npm start          # Expo Dev Server (Expo Go cobre câmera + notificações locais)
npm run android    # ou npm run ios / npm run web
```

### Validar o projeto

```bash
npm run typecheck  # tsc --noEmit (strict)
npm test           # 48 testes unitários (tsx --test)
npm run verify     # typecheck + testes
node tools/generate-assets.mjs   # regenera ícones/splash a partir da geometria do logo
npx expo export --platform android   # valida o bundle de produção
```

### Configuração opcional

```bash
cp .env.example .env
# EXPO_PUBLIC_COSMOS_TOKEN=seu_token   → habilita o fallback pago (seção 3.2)
```

Sem o token o provedor Cosmos é simplesmente ignorado (`outcome: skipped`) e o app
cai no **cadastro manual** — o fluxo nunca quebra.

## 3. Fluxo de entrada

```
Splash (~2s, logo animada) → Login (apenas o nome) → Onboarding (só na 1ª vez) → Tela principal
```

- **Splash** (`SplashScreen.tsx`): logo com fade-in, mínimo de 2s, bootstrap do app em
  paralelo (banco, ajustes, canal de notificação) e fade-out de 350ms antes de trocar
  de tela. O splash nativo (`expo-splash-screen`) fica visível até a fonte Inter e a
  primeira tela estarem prontas, evitando qualquer "flash" em branco.
- **Login** (`LoginScreen.tsx`): só o campo de nome + botão "Continuar" (desabilitado
  com campo vazio, erro visível para espaços em branco). O nome é salvo no SQLite local
  (`settings.user_profile`) e reconhecido nas próximas sessões.
- **Onboarding** (`OnboardingScreen.tsx`): 4 slides curtos com swipe ou "Próximo",
  indicador de bolinhas e "Pular" sempre visível; grava a flag
  `settings.app_settings.onboardingDone = true` ao concluir ou pular.

Regras de roteamento ficam em `src/utils/appFlow.ts` (módulo puro, coberto por testes).

## 4. Telas implementadas (design de referência)

| # | Tela do design | Arquivo |
|---|---|---|
| 1 | Tela de abertura | `src/screens/SplashScreen.tsx` |
| 2 | Login (simplificado: só nome) | `LoginScreen.tsx` |
| — | Onboarding (novo, 4 slides) | `OnboardingScreen.tsx` |
| 3 | Home "O que consumir primeiro?" | `HomeScreen.tsx` |
| 4 | Adicionar alimento | `AddProductScreen.tsx` |
| 5 | Scanner de código de barras | `ScannerScreen.tsx` |
| 6 | Produto encontrado | `ProductFoundScreen.tsx` |
| 7 | Detalhes do alimento | `ProductDetailsScreen.tsx` |
| 8 | Meu estoque | `StockScreen.tsx` |
| 9 | Histórico | `HistoryScreen.tsx` |
| 10 | Perfil | `ProfileScreen.tsx` |
| 11 | Notificações (exemplo + controle) | `NotificationSettingsScreen.tsx` |
| 12 | Menu lateral | `SideMenuScreen.tsx` |

Extras exigidos pelo fluxo: `ManualProductScreen` (fallback da seção 4.4),
`EditProductScreen`, `EditProfileScreen`, `SettingsScreen`, `PrivacyScreen`
(LGPD) e `HelpScreen`. O formulário de cadastro (`ProductForm.tsx`) é
compartilhado pelas telas 4, 6 e pelo cadastro manual, garantindo as mesmas
validações nos três caminhos.

## 5. Arquitetura

```
App.tsx                     # fontes, NavigationContainer, toque em notificação, refresh no foreground
src/
  components/               # AppText, Button, TextField, DateField, SelectField, ProductForm,
                            # ProductListItem, SegmentedTabs, SideDrawer, LeafDecor, Logo, Banner...
  constants/                # categorias (ícone + cor) e frequências de lembrete
  db/                       # database.ts (migrações) e productRepository.ts (CRUD + cache + settings)
  navigation/               # RootNavigator, MainTabs, tipos e navigationRef
  screens/                  # 18 telas
  services/
    productApi.ts           # Open Food Facts + Cosmos (fetch com timeout e User-Agent)
    productLookup.ts        # núcleo puro da cascata (provedores injetáveis)
    productResolver.ts      # fiação com o cache SQLite
    notificationPlanner.ts  # regras puras de agendamento
    notifications.ts        # expo-notifications (agendar / cancelar / reagendar)
  store/                    # useProductStore (produtos + agenda), useSettingsStore (perfil/ajustes)
  theme/                    # cores, tipografia Inter, espaçamentos, sombras
  types/, utils/            # modelos e utilitários puros (barcode, datas, categoria, id)
tests/                      # 48 testes unitários das regras de negócio
tools/generate-assets.mjs   # gerador dos PNGs de ícone / splash / notificação
```

## 6. Modelo de dados (seção 6 da especificação)

```
products
  id TEXT PK                  # prd_<timestamp36><random>
  barcode TEXT                # normalizado (só dígitos)
  name / image_url / category / quantity / unit
  source                      # openfoodfacts | cosmos | manual
  expiration_date TEXT        # yyyy-mm-dd (comparável como texto)
  reminder_frequency          # daily | every_3_days | weekly | 1_day_before | custom
  custom_interval_days INTEGER?
  status                      # active | consumed | discarded | expired
  notification_ids TEXT       # JSON com os ids das notificações pendentes
  created_at / consumed_at / discarded_at

product_cache                  # cache da resolução de GTIN (seção 3.3)
settings                       # perfil local e preferências (JSON por chave)
```

Desvio consciente do modelo da especificação: `status` também tem `discarded`,
exigido pelas abas "Descartados" das telas 8 e 9 do design. `expired` significa
"passou da validade e ainda está em estoque".

## 7. Notificações: regras implementadas

- **Ancoragem retroativa na validade** (seção 4.2): as ocorrências são
  `validade − k × intervalo`, não "a partir de hoje".
- **Nada depois da validade**, exceto um aviso final de "produto vencido"
  (validade + 1 dia, configurável).
- **Horário configurável** (padrão 09:00); horários já passados são descartados.
- **Cancelamento** (seção 5.4): consumir, descartar ou excluir cancela 100% dos
  ids pendentes; editar validade/frequência cancela e reagendar do zero.
- **Persistência pelo SO**: triggers `DATE` do `expo-notifications` (sobrevivem
  ao fechamento do app); ids ficam em `products.notification_ids`.
- **Orçamento do sistema**: o iOS mantém no máximo 64 notificações locais
  pendentes. O app usa um orçamento global de 60 e redistribui o excedente
  priorizando o que vence antes (`rebuildAllSchedules`), reexecutado no boot e
  no retorno do background.

Desvio consciente da seção 5.2: um trigger `DATE` por ocorrência em vez de
`DAILY`/`WEEKLY`/`TIME_INTERVAL` repetidos, porque um trigger de repetição não
pode ser interrompido na data de validade (violaria a regra acima) nem
cancelado sem que o app rode. A regra de negócio tem prioridade.

## 8. Critérios de aceite (seção 7) → como validar

| Critério | Implementação / validação |
|---|---|
| Preencher nome/foto em < 3s no 4G | `productApi` com timeout de 8s + cache local; consulta real validada (`7891000100103` → Leite Condensado Moça 395 g) |
| API falhou → não trava, cai no manual | `lookupProduct` devolve `offline_error`/`not_found` e o scanner navega para `ManualProduct` (coberto por testes) |
| Impedir salvar sem validade/frequência | validação em `ProductForm.handleSubmit` (também rejeita validade passada) |
| Notificações sobrevivem ao app fechado | triggers `DATE` do `expo-notifications` (o SO persiste) |
| Excluir cancela 100% das pendências | `removeProduct` → `cancelProductNotifications`; confira em Notificações → "Lembretes pendentes no aparelho" |
| Offline funciona exceto a consulta inicial | toda leitura/escrita é SQLite; apenas `productApi` usa rede |

Status da validação neste repositório: `npm run typecheck` ✅,
`npm test` (48 testes) ✅ e `npx expo export --platform android` ✅.

## 9. Roadmap pós-v1 (seção 8)

- OCR da validade impressa (ML Kit Text Recognition).
- Histórico de desperdício como insight/gamificação (a base já está no histórico).
- Backend leve (Supabase) para sincronizar dispositivos — o login social
  (Google/Apple) depende disso e está desabilitado com aviso honesto na v1.
- Sugestões de receitas para produtos perto do vencimento.

