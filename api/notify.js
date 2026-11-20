// WineCoding: e-mailová upozornění
// Volá ji databáze Supabase (trigger notify_project_change) při novém a schváleném projektu.
// Proměnné prostředí ve Vercelu:
//   WEBHOOK_SECRET      sdílené tajemství, stejné jako v triggeru v Supabase
//   GMAIL_USER          adresa účtu WineCoding v Gmailu (odesílatel)
//   GMAIL_APP_PASSWORD  heslo aplikace z účtu Google (vkládá jen Hana)
//   ADMIN_EMAIL         kam chodí upozornění na nové projekty (nepovinné, jinak GMAIL_USER)

const nodemailer = require('nodemailer');

const SITE = 'https://winecoding.com';
const CATEGORY = { education: 'Vzdělávání', home: 'Domácnost', creative: 'Kreativita', wellbeing: 'Wellbeing', fun: 'Zábava', utility: 'Utility' };

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const validEmail = (e) => typeof e === 'string' && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e) && e.length <= 120;

function layout(title, bodyHtml) {
    return `<!doctype html><html lang="cs"><body style="margin:0;background:#f7efe6;font-family:Helvetica,Arial,sans-serif;color:#22111a">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <div style="font-weight:800;font-size:18px;letter-spacing:-0.5px;color:#8c1d40;margin-bottom:18px">🍷 WineCoding</div>
  <div style="background:#fffaf4;border-radius:20px;padding:28px 26px;border:1px solid rgba(34,17,26,0.08)">
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">${title}</h1>
    ${bodyHtml}
  </div>
  <p style="font-size:12px;color:#957c86;margin-top:18px">WineCoding · Code with joy, share with love · <a href="${SITE}" style="color:#8c1d40">winecoding.com</a></p>
</div></body></html>`;
}
const button = (href, label) => `<p style="margin:22px 0 4px"><a href="${href}" style="display:inline-block;background:#8c1d40;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${label}</a></p>`;
const greeting = (r) => (r.author_name && r.author_name !== 'Anonym' ? `Ahoj ${esc(r.author_name)},` : 'Ahoj,');

function adminMail(r) {
    return {
        subject: `Nový projekt ke schválení: ${r.name}`,
        html: layout('Nový projekt čeká na schválení', `
            <p style="margin:0 0 6px"><strong>${esc(r.name)}</strong> · ${esc(CATEGORY[r.category] || r.category)}</p>
            <p style="margin:0 0 12px"><a href="${esc(r.url)}" style="color:#8c1d40">${esc(r.url)}</a></p>
            <p style="margin:0 0 12px">${esc(r.description)}</p>
            ${r.story ? `<p style="margin:0 0 12px;font-style:italic;color:#5e4650">„${esc(r.story)}“</p>` : ''}
            <p style="margin:0;color:#5e4650">Autor: ${esc(r.author_name || 'Anonym')}${r.email ? ` · ${esc(r.email)}` : ''}</p>
            ${button(`${SITE}/admin.html`, 'Otevřít admin')}`)
    };
}
function submittedMail(r) {
    return {
        subject: `Díky za projekt ${r.name} 🍷`,
        html: layout('Díky, projekt je u nás!', `
            <p>${greeting(r)}</p>
            <p>díky, že jsi přidal/a projekt <strong>${esc(r.name)}</strong> na WineCoding. Teď ho krátce zkontrolujeme, a jakmile ho schválíme, ozveme se ti.</p>
            ${button(`${SITE}/projects.html`, 'Prohlédnout galerii')}`)
    };
}
function approvedMail(r) {
    return {
        subject: `${r.name} je na WineCodingu 🎉`,
        html: layout('Tvůj projekt je v galerii!', `
            <p>${greeting(r)}</p>
            <p>projekt <strong>${esc(r.name)}</strong> jsme schválili a už ho najdeš v galerii. Díky, že ho sdílíš s ostatními!</p>
            ${button(`${SITE}/projects.html`, 'Zobrazit v galerii')}`)
    };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || req.headers['x-webhook-secret'] !== secret) return res.status(401).json({ error: 'unauthorized' });

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return res.status(503).json({ error: 'email not configured' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { type, record, old_record: old } = body || {};
    if (!record || !record.name) return res.status(400).json({ error: 'no record' });

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    const from = `"WineCoding" <${user}>`;
    const admin = process.env.ADMIN_EMAIL || user;
    const jobs = [];

    if (type === 'INSERT' && record.status === 'pending') {
        jobs.push({ to: admin, replyTo: validEmail(record.email) ? record.email : undefined, ...adminMail(record) });
        if (validEmail(record.email)) jobs.push({ to: record.email, ...submittedMail(record) });
    }
    if (type === 'UPDATE' && record.status === 'approved' && old && old.status !== 'approved' && validEmail(record.email)) {
        jobs.push({ to: record.email, ...approvedMail(record) });
    }

    const results = [];
    for (const job of jobs) {
        try { await transporter.sendMail({ from, ...job }); results.push({ to: job.to === admin ? 'admin' : 'author', ok: true }); }
        catch (e) { console.error('send failed', e.message); results.push({ ok: false, error: e.message }); }
    }
    return res.status(200).json({ sent: results });
};
