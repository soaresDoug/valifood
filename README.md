# ValiFood

**Mais controle. Menos desperdício.**

App mobile (React Native + Expo) que evita que produtos comprados no supermercado
vençam esquecidos na despensa. Fluxo central:

> **escanear → identificar → informar validade → ser lembrado**

Implementação da especificação técnica v1 (`valifood-spec.md`) seguindo o design
de referência (12 telas + paleta + tipografia Inter).

---

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.86 + **Expo SDK 57** + TypeScript estrito |
| Navegação | `@react-navigation/native-stack` + `bottom-tabs` |
| Scanner | `expo-camera` (`CameraView` + `onBarcodeScanned`) — `expo-barcode-scanner` foi removido no SDK 52 |
| Notificações | `expo-notifications` (**notificações locais agendadas**, sem servidor de push) |
| Persistência | `expo-sqlite` (local-first, com migrações por `PRAGMA user_version`) |
| Estado | `zustand` |
| API de produtos | Open Food Facts (primária) + Cosmos Bluesoft (fallback opcional) |
| UI | Componentes próprios + `@expo/vector-icons` (MaterialCommunityIcons) + `react-native-svg` (logo) + `@expo-google-fonts/inter` |

## 2. Como rodar

```bash
npm install
npm start          # Expo Dev Server (Expo Go funciona para câmera + notificações locais)
npm run android    # ou npm run ios / npm run web
```

Validação do projeto:

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

## 3. Telas implementadas (design de referência)

| # | Tela do design | Arquivo |
|---|---|---|
| 1 | Tela de abertura | `src/screens/SplashScreen.tsx` |
| 2 | Login / cadastro | `LoginScreen.tsx`, `SignUpScreen.tsx` |
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

Extras necessários para o fluxo: `ManualProductScreen` (fallback da seção 4.4),
`EditProductScreen` (editar validade/frequência), `EditProfileScreen`,
`SettingsScreen`, `PrivacyScreen` (LGPD), `HelpScreen`.

O formulário de cadastro (`src/components/ProductForm.tsx`) é compartilhado pelas
telas 4, 6 e pelo cadastro manual, garantindo as mesmas validações nos três caminhos.

## 4. Arquitetura

```
App.tsx                     # fontes, NavigationContainer, toque em notificação, refresh no foreground
src/
  components/               # AppText, Button, TextField, DateField, SelectField, ProductForm,
                            # ProductListItem, SegmentedTabs, SideDrawer, LeafDecor, Logo, Banner...
  constants/                # categorias (ícone+cor), frequências de lembrete
  db/                       # database.ts (migrações) e productRepository.ts (CRUD + cache + settings)
  navigation/               # RootNavigator, MainTabs, tipos e navigationRef
  screens/                  # 18 telas
  services/
    productApi.ts           # Open Food Facts + Cosmos (fetch com timeout e User-Agent)
    productLookup.ts        # núcleo puro da cascata (provedores injetáveis)
    productResolver.ts      # fiação com o cache SQLite
    notificationPlanner.ts  # regras puras de agendamento
    notifications.ts        # expo-notifications (agendar/cancelar/reagendar)
  store/                    # useProductStore (produtos + agenda), useSettingsStore (perfil/ajustes)
  theme/                    # cores, tipografia Inter, espaçamentos, sombras
  types/, utils/            # modelos e utilitários puros (barcode, datas, categoria, id)
tests/                      # 48 testes unitários das regras de negócio
tools/generate-assets.mjs   # gerador dos PNGs de ícone/splash/notificação
```
