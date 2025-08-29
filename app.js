// app.js - frontend controller
const API_URL = "https://vetplat-backend.onrender.com"; // change for production

async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  opts.headers = opts.headers || {};
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_URL + path, opts);
  // some endpoints return plain text or 204 - handle
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e) { return txt || {}; }
}

// NAV / session helpers
function showLoggedIn(user){
  document.getElementById('nav-auth')?.style && (document.getElementById('nav-auth').style.display = 'none');
  const navUser = document.getElementById('nav-user');
  if(navUser){ navUser.style.display = 'inline'; navUser.textContent = user.firstName; }
  const userMenu = document.getElementById('nav-user-menu');
  if(navUser){
    navUser.addEventListener('click', (e)=>{
      const menu = document.getElementById('nav-user-menu');
      if(menu) menu.style.display = menu.style.display==='block' ? 'none' : 'block';
    });
  }
  const dashLink = document.getElementById('nav-dash-link');
  if(dashLink) dashLink.style.display='inline';
}
function logout(){
  localStorage.removeItem('token'); localStorage.removeItem('user');
  window.location = 'index.html';
}

// run on all pages
document.addEventListener('DOMContentLoaded', async ()=>{
  // init nav
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  if(storedUser) showLoggedIn(storedUser);

  // logout handler
  document.getElementById('logout')?.addEventListener('click', (e)=>{ e.preventDefault(); logout(); });
  document.getElementById('logoutBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); logout(); });

  // INDEX page
  if(document.getElementById('doctors')){
    // search buttons
    document.getElementById('searchBtn').onclick = ()=> loadDoctors(document.getElementById('filter-specialization').value, document.getElementById('filter-location').value);
    document.getElementById('clearBtn').onclick = ()=> { document.getElementById('filter-specialization').value=''; document.getElementById('filter-location').value=''; loadDoctors(); };

    await loadDoctors();
  }

  // LOGIN form
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await api('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})});
      if(res.token){
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        alert('Logged in');
        window.location = 'index.html';
      } else {
        document.getElementById('error').textContent = res.error || 'Login failed';
      }
    });
  }

  // REGISTER
  const regForm = document.getElementById('registerForm');
  if(regForm){
    const role = document.getElementById('role');
    role.addEventListener('change', ()=> {
      document.getElementById('doctorExtra').style.display = role.value === 'Doctor' ? 'block' : 'none';
    });

    regForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const body = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        village: document.getElementById('village').value,
        tehsil: document.getElementById('tehsil').value,
        district: document.getElementById('district').value,
        state: document.getElementById('state').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
      };
      if(body.role === 'Doctor'){
        body.specialization = document.getElementById('specialization').value;
        body.feesTeleconsult = Number(document.getElementById('feesTeleconsult').value || 0);
        body.feesVisit = Number(document.getElementById('feesVisit').value || 0);
      }
      const res = await api('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      if(res.ok){
        alert('Registered successfully. Doctors require admin approval to appear on home page.');
        window.location = 'login.html';
      } else {
        alert(res.error || 'Register failed');
      }
    });
  }

  // BOOK page
  const bookForm = document.getElementById('bookForm');
  if(bookForm){
    // populate doctors
    const docs = await api('/api/doctors');
    const sel = document.getElementById('doctorSelect');
    sel.innerHTML = '';
    (docs||[]).forEach(d=>{
      const o = document.createElement('option');
      o.value = d._id;
      o.textContent = `${d.firstName} ${d.lastName} • ${d.specialization||''} • Online: ₹${d.feesTeleconsult||'-'}`;
      sel.appendChild(o);
    });

    // if a doctor was selected on home page (selectedDoctor)
    const sdoc = localStorage.getItem('selectedDoctor');
    if(sdoc) { sel.value = sdoc; localStorage.removeItem('selectedDoctor'); }

    // when doctor select change load slots
    sel.addEventListener('change', ()=> loadSlotsForSelectedDoctor());

    document.getElementById('mode').addEventListener('change', (e)=>{
      if(e.target.value === 'Online') document.getElementById('slotWrapper').style.display='block';
      else document.getElementById('slotWrapper').style.display='block'; // date needed even for in-person
    });

    // load initial slots
    await loadSlotsForSelectedDoctor();

    bookForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const token = localStorage.getItem('token');
      if(!token) { alert('Please login first'); return window.location = 'login.html'; }
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        farmerId: user.id,
        doctorId: document.getElementById('doctorSelect').value,
        mode: document.getElementById('mode').value,
        date: document.getElementById('date').value,
        slot: document.getElementById('slotSelect').value || null,
        symptoms: document.getElementById('symptoms').value,
        animalType: document.getElementById('animalType').value
      };
      const res = await api('/api/appointments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(res._id){
        // If mode Online -> immediate payment flow (simulated)
        if(payload.mode === 'Online'){
          // Simulate payment: call /api/appointments/:id/pay
          await simulatePaymentAndConfirm(res._id);
        } else {
          alert('Request created. Doctor will review and you'll get notified.');
          window.location = 'dashboard.html';
        }
      } else {
        alert(res.error || 'Failed to create request');
      }
    });
  }

  // DASHBOARD page
  if(document.getElementById('appointments')){
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if(!user) return window.location = 'login.html';
    document.getElementById('nav-user-name')?.style && (document.getElementById('nav-user-name').textContent = user.firstName);
    await renderDashboard(user);
  }

  // ADMIN page
  if(document.getElementById('pending')){
    // Admin authentication is very light here (use admin token)
    const data = await api('/api/admin/pending-doctors');
    const pending = document.getElementById('pending');
    pending.innerHTML = '';
    (data||[]).forEach(d=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<b>${d.firstName} ${d.lastName}</b><div class="meta">${d.village}, ${d.district}</div>
        <div class="actions"><button onclick="decideDoc('${d._id}','approve')">Approve</button><button class="secondary" onclick="decideDoc('${d._id}','reject')">Reject</button></div>`;
      pending.appendChild(div);
    });

    const appts = await api('/api/appointments/all');
    const apCont = document.getElementById('allAppointments');
    apCont.innerHTML = '';
    (appts||[]).forEach(a=>{
      const c = document.createElement('div'); c.className='card';
      c.innerHTML = `<b>${a.mode}</b> • ${a.animalType} • ${a.status} • Farmer: ${a.farmer?.firstName || 'hidden'} • Doctor: ${a.doctor?.firstName || 'n/a'} <div class="small muted">Payment: ${a.paymentStatus}</div>`;
      apCont.appendChild(c);
    });
  }
}); // DOMContentLoaded end

// ----------------- functions -----------------
async function loadDoctors(specialization, location){
  const q = new URLSearchParams();
  if(specialization) q.set('specialization', specialization);
  if(location) q.set('location', location);
  const docs = await api('/api/doctors?'+q.toString());
  const cont = document.getElementById('doctors'); if(!cont) return;
  cont.innerHTML='';
  (docs||[]).forEach(d=>{
    const card = document.createElement('div');
    card.className='card-doctor card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">${d.firstName} ${d.lastName}</div>
        <div class="meta">${d.village ? d.village+',' : ''} ${d.district ? d.district+',' : ''} ${d.state || ''} • ${d.specialization ?? ''}</div>
        <div class="fees">Online: ₹${d.feesTeleconsult ?? '-'} &nbsp;&nbsp; Visit: ₹${d.feesVisit ?? '-'}</div>
      </div>
      <div><button onclick="chooseDoctor('${d._id}')">Book Appointment</button></div>
    </div>`;
    cont.appendChild(card);
  });
}

function chooseDoctor(id){
  localStorage.setItem('selectedDoctor', id);
  const token = localStorage.getItem('token');
  if(!token) return window.location = 'login.html';
  window.location = 'book.html';
}

async function loadSlotsForSelectedDoctor(){
  const docId = document.getElementById('doctorSelect').value;
  const slotSelect = document.getElementById('slotSelect');
  slotSelect.innerHTML = '';
  if(!docId) return;
  const doc = await api('/api/doctors/' + docId);
  // doc.availability = [{date: '2025-08-29', slots: ['10:00-10:15', '10:30-10:45']}]
  const today = new Date().toISOString().slice(0,10);
  if(doc && doc.availability){
    for(const av of doc.availability){
      if(av.date < today) continue;
      av.slots.forEach(s => {
        const o = document.createElement('option');
        o.value = `${av.date} ${s}`;
        o.textContent = `${av.date} • ${s}`;
        slotSelect.appendChild(o);
      });
    }
  } else {
    const o = document.createElement('option'); o.value=''; o.textContent='No slots available';
    slotSelect.appendChild(o);
  }
}

// Dashboard rendering
async function renderDashboard(user){
  const info = document.getElementById('userInfo');
  info.innerHTML = `<b>${user.firstName} ${user.lastName}</b><div class="meta">${user.role} • ${user.village || ''} ${user.district || ''}</div>`;

  const apptsCont = document.getElementById('appointments');
  apptsCont.innerHTML = '';

  if(user.role === 'Farmer'){
    const list = await api('/api/appointments?farmerId=' + user.id);
    (list||[]).forEach(a=>{
      const c = document.createElement('div'); c.className='card';
      c.innerHTML = `<b>${a.mode}</b> • ${a.animalType} • Status: ${a.status} • Payment: ${a.paymentStatus}
        ${a.meetLink ? `<div><a target="_blank" href="${a.meetLink}">Join Meet</a> • <a target="_blank" href="https://wa.me/?text=${encodeURIComponent('Meet link: '+a.meetLink)}">Send on WhatsApp</a></div>` : '' }
        <div class="small muted">Doctor note: ${a.doctorNote || '—'}</div>`;
      apptsCont.appendChild(c);
    });
  } else if(user.role === 'Doctor'){
    // show incoming appointment requests
    const list = await api('/api/appointments?doctorId=' + user.id);
    (list||[]).forEach(a=>{
      const c = document.createElement('div'); c.className='card';
      // doctor sees limited farmer info for in-person pending requests
      const farmerInfo = (a.mode==='InPerson' && a.status === 'Pending') ? `${a.fromVillage || '—'} • ${a.animalType}` : `${a.farmer?.firstName || ''} ${a.farmer?.lastName || ''} • ${a.farmer?.mobile || ''}`;
      c.innerHTML = `<b>${a.mode}</b> • ${a.date || ''} • ${a.slot || ''} • ${farmerInfo} • Status: ${a.status}
        <div class="muted small">Symptoms: ${a.symptoms}</div>
        <div class="actions"> ${a.status==='Pending'? `<button onclick="decide('${a._id}','accept')">Accept</button><button class="secondary" onclick="decide('${a._id}','reject')">Reject</button><button class="secondary" onclick="suggest('${a._id}')">Suggest New Time</button>` : '' }
        </div>`;
      apptsCont.appendChild(c);
    });

    // doctor controls to manage availability
    const ctrl = document.getElementById('doctorControls');
    ctrl.innerHTML = '';
    ctrl.appendChild(renderAvailabilityControls(user.id));
  }
}

function renderAvailabilityControls(doctorId){
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `<h3>Availability (Online slots)</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="availDate" type="date" />
      <input id="availSlots" placeholder="slots comma separated e.g. 10:00-10:15,10:30-10:45" />
      <button id="saveAvail">Save</button>
    </div>
    <div class="muted small">Saved availability will appear on booking form.</div>`;
  setTimeout(()=> {
    wrap.querySelector('#saveAvail').addEventListener('click', async ()=>{
      const date = wrap.querySelector('#availDate').value;
      const slotsRaw = wrap.querySelector('#availSlots').value;
      if(!date || !slotsRaw) return alert('Select date and slots');
      const slots = slotsRaw.split(',').map(s=>s.trim()).filter(Boolean);
      const res = await api('/api/doctors/' + doctorId + '/availability', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({date, slots}) });
      if(res.ok) { alert('Saved'); window.location = 'dashboard.html'; } else alert(res.error||'Failed');
    });
  }, 100);
  return wrap;
}

// Doctor decision (accept/reject)
async function decide(appointmentId, decision){
  const res = await api('/api/appointments/' + appointmentId + '/decide', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({decision})});
  if(res.ok){ alert('Updated'); window.location = 'dashboard.html'; } else alert(res.error||'Failed');
}

// Doctor suggests new time
async function suggest(appointmentId){
  const newDate = prompt('Suggest new date (YYYY-MM-DD):');
  const newSlot = prompt('Suggest slot (HH:MM-HH:MM):');
  if(!newDate || !newSlot) return alert('Cancelled');
  const res = await api('/api/appointments/' + appointmentId + '/suggest', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({date:newDate, slot:newSlot})});
  if(res.ok) { alert('Suggestion sent to farmer'); window.location = 'dashboard.html'; } else alert(res.error||'Failed');
}

// Admin approve/reject doctor
window.decideDoc = async (id, decision) => {
  const res = await api('/api/admin/decide-doctor', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({doctorId:id, decision}) });
  if(res.ok){ alert('Done'); location.reload(); } else alert(res.error||'Failed');
};

// Simulate payment -> mark appointment paid and generate meet link
async function simulatePaymentAndConfirm(appointmentId){
  // call backend payment endpoint (simulated)
  const res = await api('/api/appointments/' + appointmentId + '/pay', { method:'POST' });
  if(res.ok){
    alert('Payment successful. Appointment confirmed.');
    window.location = 'dashboard.html';
  } else {
    alert('Payment failed: ' + (res.error || 'unknown'));
  }
}
