const API_BASE = "http://localhost:5000"; // backend server

// ----------- AUTH UTILS -----------
function getToken() {
  return localStorage.getItem("token");
}
function setToken(t) {
  localStorage.setItem("token", t);
}
function clearToken() {
  localStorage.removeItem("token");
}

// ----------- NAVBAR UPDATE -----------
document.addEventListener("DOMContentLoaded", () => {
  const navAuth = document.getElementById("nav-auth");
  const navUser = document.getElementById("navUser");
  const logoutBtn = document.getElementById("logoutBtn");

  if (navAuth && getToken()) {
    navAuth.textContent = "Dashboard";
    navAuth.href = "dashboard.html";
  }
  if (navUser && getToken()) {
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: "Bearer " + getToken() }
    })
      .then(res => res.json())
      .then(user => {
        navUser.textContent = `Hello, ${user.firstName}`;
      })
      .catch(() => {});
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearToken();
      window.location.href = "index.html";
    });
  }
});

// ----------- LOGIN -----------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("error").textContent = data.message;
      }
    } catch {
      document.getElementById("error").textContent = "Server error";
    }
  });
}

// ----------- REGISTER -----------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      village: document.getElementById("village").value,
      tehsil: document.getElementById("tehsil").value,
      district: document.getElementById("district").value,
      state: document.getElementById("state").value,
      mobile: document.getElementById("mobile").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: document.getElementById("role").value,
      specialization: document.getElementById("specialization")?.value,
      feesTeleconsult: document.getElementById("feesTeleconsult")?.value,
      feesVisit: document.getElementById("feesVisit")?.value
    };
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        window.location.href = "dashboard.html";
      } else {
        alert(data.message);
      }
    } catch {
      alert("Server error");
    }
  });

  const roleSelect = document.getElementById("role");
  const doctorExtra = document.getElementById("doctorExtra");
  if (roleSelect && doctorExtra) {
    roleSelect.addEventListener("change", () => {
      doctorExtra.style.display =
        roleSelect.value === "Doctor" ? "block" : "none";
    });
  }
}

// ----------- INDEX: SHOW DOCTORS -----------
if (document.getElementById("doctors")) {
  async function loadDoctors() {
    const res = await fetch(`${API_BASE}/doctor/list`);
    const docs = await res.json();
    const container = document.getElementById("doctors");
    container.innerHTML = "";
    docs.forEach(doc => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${doc.firstName} ${doc.lastName}</h3>
        <p>${doc.specialization || "General"}</p>
        <p>${doc.district}, ${doc.state}</p>
        <p>Tele: ₹${doc.feesTeleconsult || "-"}, Visit: ₹${doc.feesVisit || "-"}</p>
        <button onclick="bookDoctor('${doc._id}')">Book</button>
      `;
      container.appendChild(div);
    });
  }
  loadDoctors();

  document.getElementById("searchBtn").onclick = loadDoctors;
  document.getElementById("clearBtn").onclick = () => {
    document.getElementById("filter-specialization").value = "";
    document.getElementById("filter-location").value = "";
    loadDoctors();
  };
}

window.bookDoctor = function (doctorId) {
  if (!getToken()) {
    alert("Please log in first");
    window.location.href = "login.html";
    return;
  }
  window.location.href = `book.html?doctorId=${doctorId}`;
};

// ----------- DASHBOARD -----------
if (document.getElementById("userInfo")) {
  (async () => {
    if (!getToken()) {
      window.location.href = "login.html";
      return;
    }
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: "Bearer " + getToken() }
    });
    const user = await res.json();

    document.getElementById("userInfo").innerHTML = `
      <p><b>Name:</b> ${user.firstName} ${user.lastName}</p>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Role:</b> ${user.role}</p>
    `;

    if (user.role === "Farmer") {
      document.getElementById("farmerDashboard").style.display = "block";
      loadFarmerAppointments();
    } else if (user.role === "Doctor") {
      document.getElementById("doctorDashboard").style.display = "block";
      loadDoctorAppointments();
      setupAvailabilityForm();
    } else if (user.role === "Admin") {
      document.getElementById("adminDashboard").style.display = "block";
      loadAdminData();
    }
  })();
}

async function loadFarmerAppointments() {
  const res = await fetch(`${API_BASE}/appointment/mine`, {
    headers: { Authorization: "Bearer " + getToken() }
  });
  const appts = await res.json();
  const container = document.getElementById("appointments");
  container.innerHTML = "";
  appts.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p><b>Doctor:</b> ${a.doctor?.firstName || ""} ${a.doctor?.lastName || ""}</p>
      <p><b>Date:</b> ${new Date(a.date).toLocaleString()}</p>
      <p><b>Type:</b> ${a.type}</p>
      <p><b>Status:</b> ${a.status}</p>
    `;
    container.appendChild(div);
  });
}

async function loadDoctorAppointments() {
  const res = await fetch(`${API_BASE}/appointment/doctor`, {
    headers: { Authorization: "Bearer " + getToken() }
  });
  const appts = await res.json();
  const container = document.getElementById("doctorAppointments");
  container.innerHTML = "";
  appts.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p><b>Farmer:</b> ${a.farmer?.firstName || ""} ${a.farmer?.lastName || ""}</p>
      <p><b>Date:</b> ${new Date(a.date).toLocaleString()}</p>
      <p><b>Type:</b> ${a.type}</p>
      <p><b>Status:</b> ${a.status}</p>
    `;
    container.appendChild(div);
  });
}

function setupAvailabilityForm() {
  const form = document.getElementById("availabilityForm");
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const slots = document
        .getElementById("slots")
        .value.split(",")
        .map(s => s.trim());
      await fetch(`${API_BASE}/doctor/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify({ slots })
      });
      alert("Slots saved!");
    });
  }
}

async function loadAdminData() {
  const userRes = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: "Bearer " + getToken() }
  });
  const users = await userRes.json();
  const uCont = document.getElementById("users");
  uCont.innerHTML = "";
  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<p>${u.firstName} ${u.lastName} (${u.role})</p>`;
    uCont.appendChild(div);
  });

  const apptRes = await fetch(`${API_BASE}/admin/appointments`, {
    headers: { Authorization: "Bearer " + getToken() }
  });
  const appts = await apptRes.json();
  const aCont = document.getElementById("allAppointments");
  aCont.innerHTML = "";
  appts.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<p>${a.farmer?.firstName} with ${a.doctor?.firstName} - ${a.status}</p>`;
    aCont.appendChild(div);
  });
}
