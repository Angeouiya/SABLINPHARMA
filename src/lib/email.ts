type PasswordResetEmailInput = {
  to: string;
  name?: string | null;
  resetUrl: string;
  platform: "Utilisateur" | "Pharmacie" | "Admin";
};

type EmailResult =
  | { sent: true; provider: "resend" }
  | { sent: false; provider: "disabled"; reason: string };

const FROM_EMAIL = process.env.SABLIN_EMAIL_FROM || "SABLIN PHARMA <no-reply@sablin.ci>";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function renderPasswordResetEmail(input: PasswordResetEmailInput) {
  const greeting = input.name ? `Bonjour ${input.name},` : "Bonjour,";
  return {
    subject: `Réinitialisation de votre mot de passe SABLIN PHARMA ${input.platform}`,
    text: `${greeting}

Vous avez demandé la réinitialisation de votre mot de passe SABLIN PHARMA ${input.platform}.

Ouvrez ce lien pour choisir un nouveau mot de passe :
${input.resetUrl}

Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.

SABLIN PHARMA`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f7faf8;padding:24px;color:#10231b">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8e3dc;border-radius:12px;padding:24px">
          <h1 style="margin:0;color:#0b7a4b;font-size:22px">SABLIN PHARMA</h1>
          <p style="font-size:15px;line-height:1.6">${greeting}</p>
          <p style="font-size:15px;line-height:1.6">Vous avez demandé la réinitialisation de votre mot de passe SABLIN PHARMA ${input.platform}.</p>
          <p style="margin:24px 0">
            <a href="${input.resetUrl}" style="display:inline-block;background:#0b7a4b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
              Modifier mon mot de passe
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#51645a">Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        </div>
      </div>
    `,
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("Password reset email disabled: missing RESEND_API_KEY");
    return { sent: false, provider: "disabled", reason: "missing RESEND_API_KEY" };
  }

  const content = renderPasswordResetEmail(input);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: input.to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    });

    if (!response.ok) {
      console.warn(`Password reset email failed: provider returned ${response.status}`);
      return { sent: false, provider: "disabled", reason: "provider_error" };
    }

    return { sent: true, provider: "resend" };
  } catch {
    console.warn("Password reset email failed: provider unavailable");
    return { sent: false, provider: "disabled", reason: "provider_unavailable" };
  }
}

export function buildResetUrl(origin: string, token: string, scope: "user" | "professional") {
  const path = scope === "user" ? "/reinitialiser-mot-de-passe" : "/professionnel/reinitialiser-mot-de-passe";
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || origin);
  url.searchParams.set("token", token);
  return url.toString();
}
