/* eslint-disable no-undef */
export const config = {
  matcher: ["/", "/service-form/:path*", "/payment", "/my-orders"],
};

const SITE_NAME = "IFFY'S TECH EDU CONSULT";
const DEFAULT_TITLE = "IFFY'S TECH EDU CONSULT – Tech & Education, Simplified";
const DEFAULT_DESCRIPTION =
  "IFFY'S TECH EDU CONSULT delivers modern technology and educational consulting services — admissions, digital skills, certifications, document processing and more.";
const DEFAULT_IMAGE = "/android-chrome-512x512.png";
const DEFAULT_TYPE = "website";

function getBaseUrl(request) {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

function getPathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return "/";
  }
}

async function fetchServiceById(serviceId) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/services?id=eq.${encodeURIComponent(serviceId)}&select=name,description,price,image_url`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cf: { cacheTtl: 60, cacheEverything: true },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function transformHtml(originalHtml, og) {
  let html = originalHtml;

  // Title tag
  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(og.title)}</title>`,
  );

  // Description meta
  const metaDescription = `<meta name="description" content="${escapeHtml(og.description)}">`;
  if (/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      metaDescription,
    );
  } else {
    html = html.replace(/<\/title>/i, `</title>\n    ${metaDescription}`);
  }

  // OG + Twitter tags
  const tags = [
    `<meta property="og:type"        content="${escapeHtml(og.type)}">`,
    `<meta property="og:url"         content="${escapeHtml(og.url)}">`,
    `<meta property="og:title"       content="${escapeHtml(og.title)}">`,
    `<meta property="og:description" content="${escapeHtml(og.description)}">`,
    `<meta property="og:image"       content="${escapeHtml(og.image)}">`,
    `<meta property="og:site_name"   content="${escapeHtml(SITE_NAME)}">`,
    `<meta name="twitter:card"        content="summary_large_image">`,
    `<meta name="twitter:url"         content="${escapeHtml(og.url)}">`,
    `<meta name="twitter:title"       content="${escapeHtml(og.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(og.description)}">`,
    `<meta name="twitter:image"       content="${escapeHtml(og.image)}">`,
  ].join("\n    ");

  html = html.replace(
    /<!-- Open Graph \/ Facebook -->[\s\S]*?(?=\s*<link rel="preconnect|<\/head>)/i,
    `${tags}\n`,
  );

  return html;
}

export default async function middleware(request) {
  const pathname = getPathname(request.url);
  const baseUrl = getBaseUrl(request);

  let og = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    image: `${baseUrl}${DEFAULT_IMAGE}`,
    url: `${baseUrl}${pathname}`,
    type: DEFAULT_TYPE,
  };

  const serviceMatch = pathname.match(/^\/service-form\/([^/]+)/);
  if (serviceMatch) {
    const serviceId = serviceMatch[1];
    const service = await fetchServiceById(serviceId);
    if (service) {
      const desc =
        service.description && service.description.trim().length > 0
          ? service.description
          : `${service.name || "Service"} — Premium service at ${SITE_NAME}.`;
      og = {
        title: `${service.name || "Service"} | ${SITE_NAME}`,
        description: desc,
        image: service.image_url || `${baseUrl}${DEFAULT_IMAGE}`,
        url: `${baseUrl}/service-form/${serviceId}`,
        type: "product",
      };
    }
  } else if (pathname === "/" || pathname === "") {
    og.url = `${baseUrl}/`;
  }

  // Fetch the SPA shell
  const indexUrl = new URL("/index.html", `${baseUrl}/`);
  const originRes = await fetch(indexUrl.toString(), {
    headers: { accept: "text/html" },
    cf: { cacheTtl: 10, cacheEverything: true },
  });

  let html = originRes.ok
    ? await originRes.text()
    : `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${SITE_NAME}</title></head><body><div id="root"></div></body></html>`;

  const transformedHtml = transformHtml(html, og);

  return new Response(transformedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
