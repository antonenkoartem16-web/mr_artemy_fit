// ============================================================
//  MR. ARTEMY FIT — Contact form proxy (Cloudflare Worker)
//  Token stays here, never reaches the visitor's browser.
// ============================================================

// Which sites are allowed to send forms here
const ALLOWED_ORIGINS = [
  'https://mrartemyfit.com',
  'https://www.mrartemyfit.com'
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    // Only accept requests coming from our own site
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 403,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // --- Anti-spam (same checks as on the site, but enforced server-side) ---
    // 1. Honeypot: bots fill hidden fields, humans never see them
    if (data.website) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }
    // 2. Timing: a real person needs at least ~2.5s to fill the form
    const elapsed = Number(data.elapsed || 0);
    if (elapsed > 0 && elapsed < 2500) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // --- Validation ---
    const name = String(data.name || '').trim().slice(0, 100);
    const contact = String(data.contact || '').trim().slice(0, 100);
    const goal = String(data.goal || '').trim().slice(0, 100);
    const format = String(data.format || '').trim().slice(0, 100);
    const message = String(data.message || '').trim().slice(0, 2000);
    const lang = String(data.lang || '').trim().slice(0, 5);

    if (!name || !contact) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    const text =
      '🏋️ <b>НОВА ЗАЯВКА з сайту!</b>\n\n' +
      '👤 <b>Ім\'я:</b> ' + esc(name) + '\n' +
      '📱 <b>Контакт:</b> ' + esc(contact) + '\n' +
      '🎯 <b>Мета:</b> ' + esc(goal || '—') + '\n' +
      '📍 <b>Формат:</b> ' + esc(format || '—') + '\n' +
      '💬 <b>Про себе:</b> ' + esc(message || '—') +
      (lang ? '\n\n🌐 <i>Мова сайту: ' + esc(lang) + '</i>' : '');

    try {
      const tgRes = await fetch(
        'https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text: text,
            parse_mode: 'HTML'
          })
        }
      );
      const tgData = await tgRes.json();

      return new Response(JSON.stringify({ ok: !!tgData.ok }), {
        status: tgData.ok ? 200 : 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'send_failed' }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }
  }
};
