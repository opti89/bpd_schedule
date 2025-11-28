// api/exportPayroll.js
const fetch = require('node-fetch'); // available on vercel/node
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  // Very simple auth: require ADMIN_SECRET header matching env var (server-only)
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(500).json({ error: 'Server not configured: ADMIN_SECRET missing' });
  }
  const provided = req.headers['x-admin-secret'];
  if (!provided || provided !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { org_id, start, end } = req.query;
  if (!org_id || !start || !end) {
    return res.status(400).json({ error: 'Missing org_id, start, end' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_ROLE || !SUPABASE_URL) {
    return res.status(500).json({ error: 'Server not configured: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL missing' });
  }

  try {
    // Query schedules via PostgREST (Supabase REST). We use service_role for full access.
    const params = new URLSearchParams({
      select: 'id,title,start_ts,end_ts,user_id',
      'start_ts': `gte.${start}`,
      'end_ts': `lte.${end}`
    });
    const url = `${SUPABASE_URL}/rest/v1/schedules?org_id=eq.${org_id}&${params.toString()}`;

    const r = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Accept: 'application/json'
      }
    });
    const data = await r.json();

    // Build CSV
    const csvRows = [['id','title','start_ts','end_ts','user_id']];
    data.forEach(s => csvRows.push([s.id, (s.title||''), s.start_ts, s.end_ts, s.user_id || '']));
    const csv = csvRows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll_${org_id}_${start}_${end}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export' });
  }
};
