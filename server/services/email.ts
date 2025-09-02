import type { SendEmailCommandInput } from "@aws-sdk/client-ses";

async function getSes() {
  try {
    const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
    const region = process.env.AWS_REGION || "us-east-1";
    const client = new SESClient({ region, credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } : undefined });
    return { client, SendEmailCommand } as const;
  } catch {
    return null as any;
  }
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const from = process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || "no-reply@example.com";
  const ses = await getSes();
  if (!ses) {
    console.log("[email:fallback]", { to, subject });
    return { ok: true, transport: "log" } as const;
  }
  const params: SendEmailCommandInput = {
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html }, Text: { Data: text || html.replace(/<[^>]+>/g, " ") } },
    },
    Source: from,
  };
  try {
    const { SendEmailCommand } = ses;
    const out = await ses.client.send(new SendEmailCommand(params));
    return { ok: true, messageId: out?.MessageId } as const;
  } catch (e) {
    console.warn("[email:error]", (e as any)?.message || e);
    return { ok: false } as const;
  }
}
