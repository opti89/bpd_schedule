// frontend/js/app.js
let supabaseInstance = supabase; // alias if needed

async function appInit() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    document.getElementById && (document.getElementById('status').innerText =
      'Supabase not configured. Edit js/config.js and add your keys.');
    throw new Error('Supabase not configured. Open frontend/js/config.js and set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  
  supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // bind login/register events if present
  if (document.getElementById('btn-login')) bindAuthEvents();
}

function bindAuthEvents() {
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
    document.getElementById('status').innerText = 'Signing in...';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      document.getElementById('status').innerText = 'Error: ' + error.message;
      return;
    }
    location.href = 'dashboard.html';
  });

  document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const full_name = document.getElementById('reg-name').value;
    document.getElementById('status').innerText = 'Creating account...';
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
    if (error) {
      document.getElementById('status').innerText = 'Error: ' + error.message;
      return;
    }
    document.getElementById('status').innerText =
      'Account created. Check your email for confirmation. You will be redirected to dashboard after sign-in.';
  });
}

async function isSignedIn() {
  const session = await supabase.auth.getSession();
  return !!session?.data?.session;
}

async function getProfile() {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
  return data;
}

async function isAdmin() {
  const p = await getProfile();
  return p && p.role === 'admin';
}

async function loadCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';
  const { Calendar } = FullCalendar;
  const calendar = new Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' },
    events: async function(info, successCallback) {
      const start = info.startStr;
      const end = info.endStr;
      const { data, error } = await supabase
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
    editable: false
  });
  calendar.render();
}

function bindDashboardEvents() {
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.href = 'index.html';
  });

  document.getElementById('btn-request-to').addEventListener('click', async () => {
    const start_date = document.getElementById('to-start').value;
    const end_date = document.getElementById('to-end').value;
    const reason = document.getElementById('to-reason').value;
    document.getElementById('to-status').innerText = 'Submitting...';
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { location.href = 'index.html'; return; }
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
    const { error } = await supabase.from('time_off_requests').insert({
      org_id: profile.org_id,
      user_id: user.id,
      start_date,
      end_date,
      reason
    });
    document.getElementById('to-status').innerText = error ? 'Error: ' + error.message : 'Request submitted.';
  });
}

function bindAdminEvents() {
  document.getElementById('btn-logout-admin').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.href = 'index.html';
  });

  document.getElementById('btn-create-shift').addEventListener('click', async () => {
    const title = document.getElementById('shift-title').value;
    const start_ts = document.getElementById('shift-start').value;
    const end_ts = document.getElementById('shift-end').value;
    const user_id = document.getElementById('shift-user').value || null;
    document.getElementById('shift-status').innerText = 'Creating...';
    const user = (await supabase.auth.getUser()).data.user;
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
    const { error } = await supabase.from('schedules').insert({
      org_id: profile.org_id,
      user_id,
      title,
      start_ts,
      end_ts,
      created_by: user.id
    });
    document.getElementById('shift-status').innerText = error ? 'Error: ' + error.message : 'Created.';
    if (!error) await loadAdminData();
  });
}

async function loadAdminData() {
  const user = (await supabase.auth.getUser()).data.user;
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
  const org_id = profile.org_id;

  // time off requests
  const { data: to } = await supabase.from('time_off_requests').select('*').eq('org_id', org_id).order('created_at', { ascending: false });
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
    await supabase.from('time_off_requests').update({ status: 'approved' }).eq('id', id);
    await loadAdminData();
  }));

  toList.querySelectorAll('.deny').forEach(btn => btn.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    await supabase.from('time_off_requests').update({ status: 'denied' }).eq('id', id);
    await loadAdminData();
  }));

  // org users
  const { data: users } = await supabase.from('profiles').select('*').eq('org_id', org_id);
  const usersEl = document.getElementById('org-users');
  usersEl.innerHTML = users.map(u => `<div>${u.id} ${u.email || ''} - ${u.full_name || ''} (${u.role})</div>`).join('');
}

// initialize
appInit();
