import { Resend } from "resend";

// Resend's free tier only accepts `onboarding@resend.dev` as a sender until a custom
// domain is verified — safe, working default for a portfolio deployment.
const FROM = process.env.RESEND_FROM_EMAIL ?? "Shogi Dojo <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:5173";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function buildResetLink(rawToken: string): string {
  return `${APP_URL}/reset-password?token=${rawToken}`;
}

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  const resend = getClient();
  if (!resend) {
    // No API key configured (e.g. local dev without a Resend account) — log the link
    // instead of failing the request, so the flow is still testable end to end.
    console.warn(`[email] RESEND_API_KEY not set; reset link for ${to}: ${buildResetLink(rawToken)}`);
    return;
  }
  const link = buildResetLink(rawToken);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "将棋道場 비밀번호 재설정",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>비밀번호 재설정 요청</h2>
        <p>아래 버튼을 눌러 새 비밀번호를 설정해주세요. 이 링크는 30분 동안만 유효합니다.</p>
        <p><a href="${link}" style="display:inline-block;background:#b5432b;color:#fff;padding:10px 20px;text-decoration:none;">비밀번호 재설정</a></p>
        <p>본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
      </div>
    `,
  });
  if (error) {
    console.error("[email] Resend send failed:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
}
