import "server-only";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  get supabaseUrl() { return need("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabaseKey() { return need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"); },
  get serverSecret() { return need("BLOAT_SERVER_SECRET"); },
  get aiProvider() { return process.env.BLOAT_AI_PROVIDER ?? "mock"; },
  get aiModel() { return process.env.BLOAT_AI_MODEL ?? "claude-haiku-5-5"; },
  get anthropicKey() { return process.env.ANTHROPIC_API_KEY ?? ""; },
  get billingProvider() { return process.env.BLOAT_BILLING_PROVIDER ?? "mock"; },
  get billingWebhookSecret() { return process.env.BLOAT_BILLING_WEBHOOK_SECRET ?? ""; },
  get adminToken() { return process.env.BLOAT_ADMIN_TOKEN ?? ""; },
  get testLogin() { return process.env.BLOAT_TEST_LOGIN === "1"; },
  get resendKey() { return process.env.RESEND_API_KEY ?? ""; },
  get founderEmail() { return process.env.BLOAT_FOUNDER_EMAIL ?? ""; },
};
