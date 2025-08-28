// ====== CONFIG ======
const API_BASE = "https://your-backend.onrender.com/api"; // change to your Render backend URL

// ====== NAVBAR SESSION HANDLING ======
function setupNavbar() {
  const navAuth = document.getElementById("nav-auth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token) {
    navAuth.innerText = "Logout";
    navAuth.href = "#";
    navAuth.onclick = () => {
      localStorage.clear();
      window.location = "index.html";
    };
  } else {
    navAuth.innerText = "Log In / Register";
    navAuth.href = "login.html";
  }
}
setupNavbar();

// ====== LOGIN PAGE ======
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("name", data.user.name);
      window.location = "dashboard.html";
    } else {
      document.getElementById("error").innerText = data.message || "Login failed";
    }
  };
}

// ====== REGISTER PAGE ======
if (document.getElementById("registerForm")) {
  const roleSelect = document.getElementById("role");
  roleSelect.onchange = () => {
    document.getElementById("doctorExtra").style.display =
      roleSelect.value === "Doctor" ? "block" : "none";
  };

  document.getElementById("registerForm").onsubmit = async e => {
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
      role: document.getElementById("role").value
    };

    if (payload.role === "Doctor") {
      payload.specialization = document.getElementById("specialization").value;
      payload.feesTeleconsult = document.getElementById("feesTeleconsult").value;
      payload.feesVisit = document.getElementById("feesVisit").value;
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert("Registration successful. Please login.");
      window.location = "login.html";
    } else {
      alert(data.message || "Registration failed");
    }
  };
}

// ====== INDEX PAGE: SEARCH DOCTORS ======
async function initIndexPage() {
  if (!document.getElementById("doctors")) return;

  async function loadDoctors() {
    const spec = document.getElementById("filter-specialization").value;
    const loc = document.getElementById("filter-location").value;

    let url = `${API_BASE}/doctors`;
    const params = [];
    if (spec) params.push(`specialization=${spec}`);
    if (loc) params.push(`location=${loc}`);
    if (params.length) url += "?" + params.join("&");

    const res = await fetch(url);
    const docs = await res.json();

    const container = document.getElementById("doctors");
    container.innerHTML = "";

    docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${doc.name}</h3>
        <p>${doc.specialization || ""}</p>
        <p><b>Online Fee:</b> ₹${doc.feesTeleconsult || "-"}</p>
        <button onclick="window.location='book.html?doctor=${doc._id}'">Book Appointment</button>
      `;
      container.appendChild(card);
    });
  }

  document.getElementById("searchBtn").onclick = loadDoctors;
  document.getElementById("clearBtn").onclick = () => {
    document.getElementById("filter-specialization").value = "";
    document.getElementById("filter-location").value = "";
    loadDoctors();
  };

  loadDoctors();
}
initIndexPage();

// ====== BOOKING PAGE ======
async function initBookingPage() {
  if (!document.getElementById("bookForm")) return;

  const params = new URLSearchParams(window.location.search);
  const doctorId = params.get("doctor");
  const token = localStorage.getItem("token");

  if (!token) return (window.location = "login.html");
  if (!doctorId) {
    document.getElementById("doctorInfo").innerText = "No doctor selected";
    return;
  }

  document.getElementById("doctorId").value = doctorId;

  // Fetch doctor details
  const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const doc = await res.json();

  document.getElementById("doctorInfo").innerHTML =
    `<b>${doc.name}</b> (${doc.specialization}) - Online fee ₹${doc.feesTeleconsult}`;

  // Submit booking
  document.getElementById("bookForm").onsubmit = async e => {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ doctorId, date, time })
    });

    if (res.ok) {
      document.getElementById("bookMsg").innerText = "✅ Appointment booked successfully!";
      setTimeout(() => (window.location = "dashboard.html"), 1500);
    } else {
      const err = await res.json();
      document.getElementById("bookMsg").innerText = "❌ " + err.message;
    }
  };
}
initBookingPage();
