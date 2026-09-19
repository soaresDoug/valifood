# Guia de build e publicação — ValiFood (Expo / EAS)

Passo a passo para levar o ValiFood do código até o aparelho: gerar o APK de
distribuição direta, gerar o AAB de produção e publicar no Google Play e na
Apple App Store usando o EAS.

> Requisitos: Node 20+, conta Expo (`eas login`) e projeto vinculado
> (`npx eas init` já executado — o `projectId` consta no `app.json`).

---

## 1. Visão geral dos perfis

| Perfil (`eas.json`) | Saída Android | Uso |
|---|---|---|
| `development` | APK + dev client | desenvolvimento com Metro |
| `preview` | APK | testes internos / distribuição direta |
| `production` | **AAB** (app-bundle) | Google Play |

`app.json` já define o identificador: `app.valifood.mobile` (Android e iOS).
Antes de publicar, revise:

- `expo.version` (versão legível, ex. `1.1.0`)
- `expo.android.package` e `ios.bundleIdentifier` (não podem mudar depois de publicados)
- `extra.eas.projectId` (gerado pelo `npx eas init`)
- Permissões em `expo.android.permissions` (já mínimas: câmera, notificações, alarme exato)

---

## 2. Preparação (uma vez)

```bash
npm install -g eas-cli        # CLI do EAS
eas login                     # login com sua conta Expo
eas init                      # vincula o projeto (grava projectId no app.json)
```

Verificação do projeto antes de qualquer build:

```bash
npx expo-doctor               # valida app.json/dependências
npm run verify                # typecheck + testes
```

---

## 3. APK para distribuição direta (fora das lojas)

O perfil `preview` gera um **APK** instalável — ideal para testes com clientes,
equipe ou distribuição por WhatsApp/Drive (sem loja).

```bash
eas build --profile preview --platform android
```

Ao terminar, o terminal mostra um **link/QR** — abra no celular para baixar o
`.apk` e instale (autorize "instalar apps desconhecidos"). O mesmo link serve
para compartilhar com quem for testar.

> **Build local** (sem fila do EAS), se tiver Android Studio:
> `npx expo run:android --variant release`
> ou `eas build --profile preview --platform android --local`
> (o APK sai em `android/app/build/outputs/apk/release/app-release.apk`).

---

## 4. Build de produção (Android e iOS)

```bash
# AAB de produção (Google Play)
eas build --profile production --platform android

# Build para a App Store (iOS)
eas build --profile production --platform ios
```

O que acontece nos bastidores:

- **Android:** o EAS gera o AAB assinado. Se ainda não houver keystore, o EAS
  cria e guarda a **keystore** automaticamente. Faça backup com
  `eas credentials`.
- **iOS:** o EAS cria certificados e provisioning profiles automaticamente com
  sua conta Apple Developer — não é preciso mexer no Xcode.
- Cada build recebe um link em `https://expo.dev` para download. Use
  `--no-wait` para continuar trabalhando e acompanhe no painel.

**Importante (Expo):** alterações apenas em JS/TS podem ser publicadas via
**EAS Update** (`eas update --branch production`) sem novo build; qualquer
mudança em código nativo/config de plugin (permissões, splash, ícone, versão do
SDK) exige novo build. O ValiFood usa **apenas notificações locais** — não é
necessário configurar FCM/APNs nem chaves de push para publicar.

---

## 5. Publicar no Google Play Store

**5.1. Criar a conta de desenvolvedor**

1. Acesse `play.google.com/console` com sua conta Google e pague a taxa única
   de **US$ 25** (uma vez só).
2. Complete a verificação de identidade (pessoa física ou jurídica) e aguarde a
   aprovação (pode levar 48h+).

**5.2. Configurar o app na Play Console**

1. *Criar app* → nome **ValiFood** → aplicativo → gratuito.
2. Preencha **Dados do app**: descrição curta (80 car.) e completa, ícone 512×512
   (use `assets/icon.png`), imagem de destaque 1024×500, capturas de tela
   (mínimo 2, do celular).
3. **Classificação do conteúdo**, público-alvo (a Play pergunta se o app é para
   crianças — ValiFood não é direcionado a elas) e formulário de dados
   (*Coleta de dados*: declare que o app coleta **nenhum** dado pessoal
   compartilhado; o nome fica no aparelho e a consulta de código de barras vai
   para API pública — documente isso na política de privacidade).
4. **Política de privacidade:** hospede em uma URL pública (GitHub Pages, por
   exemplo) e informe na Play Console. Você pode apontar para o texto da seção
   de LGPD do README do repositório.
5. Preencha "Conteúdo do app": anúncios (não), compras (não), acesso ao
   dispositivo (câmera), e a seção "Segurança de dados" (não coleta).

**5.3. Subir o build e submeter**

```bash
# Faça o build de produção (seção 4) e depois submeta:
eas submit --platform android --latest
# ou manualmente: Play Console → Produção → Criar versão → subir o .aab baixado
```

- Em `eas.json` o `submit.production` já existe; para subir com um arquivo
  local: `eas submit -p android --path build/xxx.aab`
- Rota recomendada: *Testes internos* → *Testes fechados* → *Produção*.
- Preencha as informações obrigatórias: Política de Privacidade (URL),
  anúncios, conteúdo, segurança de dados (responda "não coleta dados" ou
  informe a consulta de GTIN conforme sua política).
- Envie para **revisão** e acompanhe o status (geralmente 1–7 dias).

---

## 6. Publicar na Apple App Store

**6.1. Conta e certificados**

1. Crie a conta **Apple Developer Program** (US$ 99/ano) em
   `developer.apple.com` (exige verificação de identidade).
2. No `app.json`, confirme `ios.bundleIdentifier: app.valifood.mobile`.
3. O EAS cria certificados e profiles automaticamente no build — nenhum passo
   manual de certificado é necessário.

**6.2. Configurar o app na App Store Connect**

1. Em `appstoreconnect.apple.com` → *Meus apps* → **+** → *Novo app*:
   nome, idioma, bundle id `app.valifood.mobile` e SKU (ex. `valifood`).
2. Preencha: descrição, palavras-chave, capturas de tela (6.5" e 5.5" no mínimo),
   **URL da política de privacidade** (obrigatória) e a categoria (ex. *Estilo
   de vida* ou *Utilitários*).

**6.3. Enviar o build**

```bash
# Crie uma App Store Connect API Key (App Store Connect → Usuários e acesso → Integrações)
# e configure o submit no eas.json, ou informe os dados no primeiro submit.
eas submit --platform ios --latest
```

**6.4. TestFlight e revisão**

1. No App Store Connect, o build aparece em *TestFlight* após o processamento —
   distribua a testadores internos/externos.
2. Preencha as *Informações de versão* e envie para **revisão**.
3. Cuidados típicos do review iOS: explique o uso da câmera (o Info.plist já tem
   as mensagens em português) e da permissão de notificações; o fluxo de login
   por nome local deve estar claro nas notas da versão.

---

## 7. Diferenças e cuidados por usar Expo

- **EAS Build** compila na nuvem da Expo (Android no Windows/Linux; iOS exige
  Apple Developer account, mas **não** exige Mac).
- **EAS Submit** faz o upload direto para Play Console / App Store Connect.
- **EAS Update** publica atualizações de JS/assets sem nova versão
  (`npx eas update --branch production` após `eas update:configure`).
- **Push remoto não é usado** (apenas notificações locais) — nenhuma chave de
  Firebase/APNs é necessária.
- **Android 12+ (alarmes exatos):** a permissão `SCHEDULE_EXACT_ALARM` já consta
  no `app.json`; no Android 14+ oriente o usuário a liberar
  "Alarmos e lembretes" nas configurações do app se os lembretes atrasarem.

## 8. Checklist final antes de publicar

1. `npm run verify` (typecheck + testes) passando.
2. `expo.version` atualizado no `app.json` (ou deixe `autoIncrement` no EAS).
3. Ícones/splash gerados (`node tools/generate-assets.mjs`) e conferidos.
4. Build de produção concluído sem warnings críticos.
5. Teste de instalação do zero: onboarding → cadastro por scan → lembrete chegando.
6. Política de privacidade publicada em URL pública (exigida pelas lojas).