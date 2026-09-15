import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────
   Environment variables (set these in your Vercel project
   settings — NEVER prefix them with VITE_, or they'd be
   bundled into the client-side code and exposed publicly):

   SUPABASE_URL               - your Supabase project URL
   SUPABASE_SERVICE_ROLE_KEY  - Supabase dashboard → Settings → API → service_role key
   RESEND_API_KEY             - Resend dashboard → API Keys
   SITE_URL                   - optional, defaults below
───────────────────────────────────────────────────────── */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://iffystech.com";
const FROM_EMAIL = "IFFY'S TECH EDU CONSULT <orders@mail.iffystech.com>";

/**
 * Finds the customer's email inside the order's submitted form data.
 * Primary strategy: match the service's field config for a field of
 * type "email" (this is reliable regardless of how the field is labeled).
 * Fallback: scan all submitted values for something email-shaped, in
 * case a service's fields aren't tagged correctly.
 */
function findCustomerEmail(fields, userData) {
  if (Array.isArray(fields)) {
    const emailField = fields.find((f) => f.type === "email");
    if (emailField) {
      const val = userData?.[emailField.name];
      if (typeof val === "string" && val.includes("@")) return val.trim();
    }
  }
  if (userData && typeof userData === "object") {
    for (const val of Object.values(userData)) {
      if (
        typeof val === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
      ) {
        return val.trim();
      }
    }
  }
  return null;
}

function buildEmailHtml({ orderId, serviceName }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your order is complete</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f6f1; font-family:'Manrope', Arial, Helvetica, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#f5f6f1; opacity:0;">
    Your order ${orderId} is complete and ready.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f1; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #d9ddd4; border-radius:14px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a4328; padding:28px 32px;">
              <p style="margin:0; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#c9b87c;">
                IFFY'S TECH EDU CONSULT
              </p>
              <h1 style="margin:6px 0 0; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size:20px; font-weight:800; color:#ffffff;">
                Your Order Is Complete
              </h1>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="height:4px; background-color:#c49f34; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Success badge + intro -->
          <tr>
            <td style="padding:32px 32px 8px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:56px; height:56px; background-color:#e8f0eb; border-radius:50%; text-align:center; vertical-align:middle;">
                    <span style="font-size:26px; line-height:56px;">&#9989;</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:#5f6b66; text-align:center;">
                Good news — your order has been completed and is ready for you.
              </p>
            </td>
          </tr>

          <!-- Order summary -->
          <tr>
            <td style="padding:16px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f1; border:1px solid #d9ddd4; border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#5f6b66;">
                      Order ID
                    </p>
                    <p style="margin:0; font-family:'Plus Jakarta Sans', 'Courier New', monospace; font-size:18px; font-weight:800; letter-spacing:1px; color:#1a4328;">
                      ${orderId}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 16px;">
                    <p style="margin:0 0 4px; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#5f6b66;">
                      Service
                    </p>
                    <p style="margin:0; font-size:14px; font-weight:700; color:#1f2937;">
                      ${serviceName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 32px 8px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background-color:#1a4328;">
                    <a href="${SITE_URL}/my-orders" target="_blank" style="display:inline-block; padding:13px 28px; font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif; font-size:13px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
                      View My Order →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0; font-size:12px; color:#5f6b66;">
                Enter your Order ID above to view details and any deliverables.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #d9ddd4; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0; font-size:11.5px; line-height:1.6; color:#5f6b66;">
                Thank you for choosing IFFY'S TECH EDU CONSULT. If anything looks off with your order, just reply to this email and we'll sort it out.
              </p>
              <p style="margin:10px 0 0; font-size:11px; color:#9eb1a2;">
                © IFFY'S TECH EDU CONSULT
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    console.error(
      "send-completion-email: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY env vars",
    );
    return res.status(500).json({ sent: false, error: "Server misconfigured" });
  }

  const { orderId } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ sent: false, error: "orderId is required" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Look everything up server-side — never trust order details passed
    // in from the client for what gets emailed.
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_id, status, user_data, completion_email_sent_at, service:services(name, fields)",
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error(
        "send-completion-email: order lookup failed for id",
        orderId,
        "-",
        error?.message || "no matching row",
      );
      // TEMPORARY: surfacing the real Supabase error in the response so it's
      // visible directly in the Network tab. Remove the `debug` field once
      // this is confirmed working.
      return res.status(404).json({
        sent: false,
        error: "Order not found",
        debug: error?.message || error?.code || "no matching row for that id",
      });
    }

    if (order.status !== "completed") {
      return res
        .status(400)
        .json({ sent: false, error: "Order is not marked completed" });
    }

    // Idempotency guard — enforced here, not just trusted from the client.
    if (order.completion_email_sent_at) {
      return res.status(200).json({ sent: false, reason: "already_sent" });
    }

    const customerEmail = findCustomerEmail(
      order.service?.fields,
      order.user_data,
    );
    if (!customerEmail) {
      return res.status(200).json({ sent: false, reason: "no_email" });
    }

    const html = buildEmailHtml({
      orderId: order.order_id,
      serviceName: order.service?.name || "Your Service",
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Your order ${order.order_id} is complete`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error(
        "send-completion-email: Resend rejected the send:",
        errText,
      );
      return res.status(502).json({ sent: false, reason: "send_failed" });
    }

    await supabase
      .from("orders")
      .update({ completion_email_sent_at: new Date().toISOString() })
      .eq("id", order.id);

    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error("send-completion-email error:", err);
    return res
      .status(500)
      .json({ sent: false, error: "Internal error", debug: err?.message });
  }
}
