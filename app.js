const API_URL = "https://vetplat-backend.onrender.com";
async function api(path, opts){ const res = await fetch(API_URL+path, opts); return res.json(); }
// index page logic
async function loadDoctors(specialization, location){
  const q = new URLSearchParams();
  if(specialization) q.set('specialization', specialization);
  if(location) q.set('location', location);
  const docs = await api('/api/doctors?'+q.toString());
  const cont = document.getElementById('doctors'); if(!cont) return;
  cont.innerHTML='';
  docs.forEach(d=>{
    const card = document.createElement('div');
    card.className='card-doctor card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-weight:700">${d.firstName} ${d.lastName}</div>
      <div class="meta">${d.village}, ${d.district}, ${d.state} • ${d.specialization ?? ''}</div>
      <div class="fees">Online: ₹${d.feesTeleconsult ?? '-'} &nbsp;&nbsp; Visit: ₹${d.feesVisit ?? '-'}</div></div>
      <div><button onclick="chooseDoctor('${d._id}')">Book Appointment</button></div>
    </div>`;
    cont.appendChild(card);
  });
}
function chooseDoctor(id){
  localStorage.setItem('selectedDoctor', id);
  // redirect to login if not logged in
  const token = localStorage.getItem('token');
  if(!token) return window.location='login.html';
  window.location='book.html';
}
document.addEventListener('DOMContentLoaded', ()=>{
  const search = document.getElementById('searchBtn');
  if(search) search.onclick = ()=> loadDoctors(document.getElementById('filter-specialization').value, document.getElementById('filter-location').value);
  const clear = document.getElementById('clearBtn');
  if(clear) clear.onclick = ()=> { document.getElementById('filter-specialization').value=''; document.getElementById('filter-location').value=''; loadDoctors(); }
  loadDoctors();
  // login form
  const loginForm = document.getElementById('loginForm');
  if(loginForm) loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await api('/api/auth/login',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})});
    if(res.token){ localStorage.setItem('token', res.token); localStorage.setItem('user', JSON.stringify(res.user)); alert('Logged in'); window.location='index.html'; }
    else alert(res.error || 'Login failed');
  });
  // register
  const reg = document.getElementById('registerForm');
  if(reg) reg.addEventListener('submit', async (e)=>{
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
    if(body.role==='Doctor'){
      body.specialization = document.getElementById('specialization').value;
      body.feesTeleconsult = Number(document.getElementById('feesTeleconsult').value||0);
      body.feesVisit = Number(document.getElementById('feesVisit').value||0);
    }
    const res = await api('/api/auth/register',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(res.ok) { alert('Registered - doctors need admin approval to show on home'); window.location='login.html'; }
    else alert(res.error || 'Register failed');
  });
  const role = document.getElementById('role');
  if(role) role.addEventListener('change', ()=>{ document.getElementById('doctorExtra').style.display = role.value==='Doctor' ? 'block' : 'none'; });
  // book form
  const bookForm = document.getElementById('bookForm');
  if(bookForm) {
    // populate doctors select
    (async ()=>{
      const docs = await api('/api/doctors');
      const sel = document.getElementById('doctorSelect');
      docs.forEach(d=>{ const o = document.createElement('option'); o.value=d._id; o.textContent = d.firstName+' '+d.lastName+' • '+(d.specialization||''); sel.appendChild(o); });
    })();
    bookForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const token = localStorage.getItem('token');
      if(!token) return alert('login first');
      const user = JSON.parse(localStorage.getItem('user'));
      const body = {
        farmerId: user.id,
        doctorId: document.getElementById('doctorSelect').value,
        mode: document.getElementById('mode').value,
        date: document.getElementById('date').value,
        slot: null,
        symptoms: document.getElementById('symptoms').value,
        animalType: document.getElementById('animalType').value
      };
      const res = await api('/api/appointments',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      if(res._id) { alert('Request created'); window.location='dashboard.html'; } else alert(res.error||'Failed');
    });
  }
  // dashboard page
  if(document.getElementById('dashboardContent')){
    (async ()=>{
      const user = JSON.parse(localStorage.getItem('user')||'null');
      if(!user) return window.location='login.html';
      document.getElementById('nav-user').textContent = user.firstName;
      const cont = document.getElementById('dashboardContent');
      if(user.role==='Farmer'){
        const list = await api('/api/appointments?farmerId='+user.id);
        cont.innerHTML = '<h3>Your Appointments</h3>'+ list.map(a=>`<div class="card"><b>${a.mode}</b> • ${a.animalType} • Status: ${a.status} • Payment: ${a.paymentStatus} ${a.meetLink?'<br><a href="'+a.meetLink+'">Join Meet</a>':''}</div>`).join('');
      } else if(user.role==='Doctor'){
        const list = await api('/api/appointments?doctorId='+user.id);
        cont.innerHTML = '<h3>Requests</h3>'+ list.map(a=>`<div class="card"><b>${a.mode}</b> • ${a.animalType} • From: ${a.farmer.firstName} ${a.farmer.lastName} • Status: ${a.status} <div style="margin-top:8px">${a.status==='Pending'?'<button onclick="decide(\''+a._id+'\',\'accept\')">Accept</button><button class=secondary onclick="decide(\''+a._id+'\',\'reject\')">Reject</button>':''}</div></div>`).join('');
      }
    })();
  }
  window.decide = async (id,decision)=>{
    const res = await api('/api/appointments/'+id+'/decide',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({decision})});
    if(res.ok) alert('Updated'); window.location='dashboard.html';
  };
  // admin page
  if(document.getElementById('pending')){
    (async ()=>{
      const list = await api('/api/admin/pending-doctors');
      const cont = document.getElementById('pending');
      cont.innerHTML = list.map(d=>`<div class="card"><b>${d.firstName} ${d.lastName}</b><div class="meta">${d.village}, ${d.district}</div><div style="margin-top:8px"><button onclick="decideDoc('${d._id}','approve')">Approve</button><button class='secondary' onclick="decideDoc('${d._id}','reject')">Reject</button></div></div>`).join('');
    })();
  }
  window.decideDoc = async (id,decision)=>{
    const res = await api('/api/admin/decide-doctor',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({doctorId:id, decision})});
    if(res.ok) alert('Done'); location.reload();
  };
});
