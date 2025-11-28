let sb = null;

async function appInit() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    const el = document.getElementById('status');
    if (el) el.innerText = 'Supabase not configured yet. Check environment variables in Vercel.';
    throw new Error('Supabase config missing');
  }
  sb = supabase.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  if (document.getElementById('btn-login')) bindAuthEvents();
}

function bindAuthEvents(){
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  });
  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    setStatus('Signing in...');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setStatus('Error: ' + error.message);
    setStatus('Signed in.');
    location.href = 'dashboard.html';
  });

  document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const full_name = document.getElementById('reg-name').value;
    setStatus('Creating account...');
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name } } });
    if (error) return setStatus('Error: ' + error.message);
    setStatus('Account created. Check your email for confirmation. Then sign in.');
  });
}

function setStatus(text){
  const el = document.getElementById('status') || document.getElementById('to-status') || document.getElementById('shift-status');
  if (el) el.innerText = text;
}

async function isSignedIn(){
  const s = await sb.auth.getSession();
  return !!s?.data?.session;
}

async function getUser(){
  const r = await sb.auth.getUser();
  return r?.data?.user || null;
}

async function getProfile(){
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (error) return null;
  return data;
}

async function isAdmin(){
  const p = await getProfile();
  return p && p.role === 'admin';
}

async function loadCalendar(){
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  calendarEl.innerHTML = '';
  const { Calendar } = FullCalendar;
  const calendar = new Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' },
    events: async function(fetchInfo, successCallback) {
      const start = fetchInfo.startStr;
      const end = fetchInfo.endStr;
      const { data, error } = await sb
        .from('schedules')
        .select('id,title,start_ts,end_ts,user_id')
        .gte('start_ts', start)
        .lte('end_ts', end);
      if (error) { console.error(error); successCallback([]); return; }
      const events = data.map(s => ({
        id: s.id,
        title: s.title || (s.user_id ? 'Assigned' : 'Open'),
        start: s.start_ts,
        end: s.end_ts
      }));
      successCallback(events);
    },
    editable: false,
    height: 'auto'
  });
  calendar.render();
}

function bindDashboardEvents(){
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  });

  const reqBtn = document.getElementById('btn-request-to');
  if (reqBtn) reqBtn.addEventListener('click', async () => {
    const start_date = document.getElementById('to-start').value;
    const end_date = document.getElementById('to-end').value;
    const reason = document.getElementById('to-reason').value;
    setStatus('Submitting...');
    const user = await getUser();
    if (!user) { location.href = 'index.html'; return; }
    const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
    const { error } = await sb.from('time_off_requests').insert({
      org_id: profile.org_id,
      user_id: user.id,
      start_date,
      end_date,
      reason
    });
    if (error) setStatus('Error: ' + error.message);
    else setStatus('Request submitted.');
  });
}

function bindAdminEvents(){
  const logoutBtn = document.getElementById('btn-logout-admin');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  });

  const createBtn = document.getElementById('btn-create-shift');
  if (createBtn) createBtn.addEventListener('click', async () => {
    const title = document.getElementById('shift-title').value;
    const start_ts = document.getElementById('shift-start').value;
    const end_ts = document.getElementById('shift-end').value;
    const user_id = document.getElementById('shift-user').value || null;
    setStatus('Creating...');
    const user = await getUser();
    const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
    const { error } = await sb.from('schedules').insert({
      org_id: profile.org_id,
      user_id,
      title,
      start_ts,
      end_ts,
      created_by: user.id
    });
    if (error) setStatus('Error: ' + error.message);
    else {
      setStatus('Created.');
      await loadAdminData();
    }
  });
}

async function loadAdminData(){
  const user = await getUser();
  if (!user) return;
  const { data: profile } = await sb.from('profiles').select('org_id').eq('id', user.id).single();
  const org_id = profile.org_id;

  // time off
  const { data: to } = await sb.from('time_off_requests').select('*').eq('org_id', org_id).order('created_at', { ascending: false });
  const toList = document.getElementById('timeoff-list');
  toList.innerHTML = '';
  to.forEach(r => {
    const el = document.createElement('div');
    el.innerHTML = `<strong>${r.user_id}</strong> ${r.start_date} → ${r.end_date} <br/> ${r.reason} <br/> Status: ${r.status}
      ${r.status === 'pending' ? '<button data-id="'+r.id+'" class="approve">Approve</button><button data-id="'+r.id+'" class="deny">Deny</button>' : ''}`;
    toList.appendChild(el);
  });
  toList.querySelectorAll('.approve').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    await sb.from('time_off_requests').update({ status: 'approved' }).eq('id', id);
    await loadAdminData();
  }));
  toList.querySelectorAll('.deny').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    await sb.from('time_off_requests').update({ status: 'denied' }).eq('id', id);
    await loadAdminData();
  }));

  const { data: users } = await sb.from('profiles').select('*').eq('org_id', org_id);
  const usersEl = document.getElementById('org-users');
  usersEl.innerHTML = users.map(u => `<div>${u.id} ${u.email || ''} - ${u.full_name || ''} (${u.role})</div>`).join('');
  const assignSelect = document.getElementById('shift-user');
  if (assignSelect) {
    assignSelect.innerHTML = '<option value="">— open shift —</option>';
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.text = `${u.full_name || u.email || u.id} (${u.role})`;
      assignSelect.appendChild(opt);
    });
  }
}

window.addEventListener('load', () => {
  });
