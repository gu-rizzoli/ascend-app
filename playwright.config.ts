import { defineConfig, devices } from "@playwright/test";

// Testes de ponta a ponta (RNF-05): o app de produção (`pnpm build`) rodando
// contra um banco descartável. Nunca contra o Neon: cada teste cria contas.
const banco = process.env.DATABASE_URL_TESTE;
if (banco?.includes("neon.tech")) {
  throw new Error("Os testes de ponta a ponta não rodam no banco do Neon.");
}

const PORTA = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    {
      name: "computador",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `pnpm start --port ${PORTA}`,
    url: `http://localhost:${PORTA}/entrar`,
    reuseExistingServer: !process.env.CI,
    env: banco ? { DATABASE_URL: banco } : {},
  },
});
