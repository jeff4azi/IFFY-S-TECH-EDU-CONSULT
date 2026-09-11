import emailjs from "@emailjs/browser";

/* ─────────────────────────────────────────────────────────
   EmailJS Configuration
   Paste your credentials from https://dashboard.emailjs.com
───────────────────────────────────────────────────────── */
const EMAILJS_PUBLIC_KEY = "qboIpC6UEbiAJMG5b";
const EMAILJS_SERVICE_ID = "service_w6ypubr";
const EMAILJS_TEMPLATE_ID = "template_kgyoq5s";

/**
 * Sends an email alert to the business owner whenever a new
 * order is placed. Designed to never block or break the order
 * flow — if the email fails, the order still goes through, we
 * just log the failure.
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.serviceName
 * @param {string} params.price
 * @param {Object} [params.formData] - the customer's submitted field answers
 * @param {string} [params.receiptUrl]
 */
export async function sendOrderNotification({
  orderId,
  serviceName,
  price,
  formData = {},
  receiptUrl,
}) {
  try {
    const orderDetails =
      Object.entries(formData)
        .filter(
          ([, value]) =>
            value && typeof value === "string" && !value.startsWith("data:"),
        )
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n") || "No additional details submitted";

    const templateParams = {
      order_id: orderId,
      service_name: serviceName,
      service_price: price,
      order_details: orderDetails,
      receipt_url: receiptUrl || "Not provided",
      order_date: new Date().toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      { publicKey: EMAILJS_PUBLIC_KEY },
    );
  } catch (err) {
    console.error("Order notification email failed to send:", err);
    // Intentionally swallowed — a failed notification email
    // should never prevent the customer's order from completing.
  }
}
