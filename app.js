// app.js

const API_BASE = "http://localhost:5000/api"; // change if backend runs elsewhere

// ------------------ AUTH HELPERS ------------------
function getToken() {
  return localStorage.getItem("token");
}
function setToken(token) {
  localStorage.setItem("token", token);
}
function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// ------------------ PAGE DETECTION ------------------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.endsWith("index.html") || path === "/" || path === "") {
    loadDoctors();
  }
  if (path.endsWith("login.html")) {
    initLogin();
  }
  if (path.endsWith("register.html")) {
    initRegister();
  }
  if (path.endsWith("dashboard.html")) {
    loadDashboard();
  }
  if (path.endsWith("book.html")) {
    initBooking();
  }

  // logout handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearToken();
      window.location.href = "index.html";
    });
  }
});

// ------------------ INDEX PAGE ------------------
async function loadDoctors() {
  const doctorsDiv = document.getElementById("doctors");
  if (!doctorsDiv) return;

  const specialization = document.getElementById("filter-specialization")?.value || "";
  const location = document.getElementById("filter-location")?.value || "";

  let url = `${API_BASE}/doctor/list?specialization=${encodeURIComponent(specialization)}&location=${encodeURIComponent(location)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    doctorsDiv.innerHTML = "";

    data.forEach(doc => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>Dr. ${doc.firstName} ${doc.lastName}</h3>
        <p><b>Specialization:</b> ${doc.specialization || "General"}</p>
        <p><b>Location:</b> ${doc.district}, ${doc.state}</p>
        <p><b>Online Fee:</b> ₹${doc.feesTeleconsult || "-"}</p>
        <p><b>Visit Fee:</b> ₹${doc.feesVisit || "-"}</p>
        <button onclick="bookDoctor('${doc._id}')">Book</button>
      `;
      doctorsDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading doctors:", err);
  }

  document.getElementById("searchBtn")?.addEventListener("click", loadDoctors);
  document.getElementById("clearBtn")?.addEventListener("click", () => {
    document.getElementById("filter-specialization").value = "";
    document.getElementById("filter-location").value = "";
    loadDoctors();
  });
}

function bookDoctor(doctorId) {
  window.location.href = `book.html?doctorId=${doctorId}`;
}

// ------------------ LOGIN ------------------
function initLogin() {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("error");

  form.addEventListener("submit", async e => {
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
        setUser(data.user);
        window.location.href = "dashboard.html";
      } else {
        errorEl.textContent = data.message || "Login failed";
      }
    } catch (err) {
      errorEl.textContent = "Error connecting to server";
    }
  });
}

// ------------------ REGISTER ------------------
function initRegister() {
  const form = document.getElementById("registerForm");
  const roleSelect = document.getElementById("role");
  const doctorExtra = document.getElementById("doctorExtra");

  roleSelect.addEventListener("change", () => {
    doctorExtra.style.display = roleSelect.value === "Doctor" ? "block" : "none";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const body = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      village: document.getElementById("village").value,
      tehsil: document.getElementById("tehsil").value,
      district: document.getElementById("district").value,
      state: document.getElementById("state").value,
      mobile: document.getElementById("mobile").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: roleSelect.value
    };

    if (roleSelect.value === "Doctor") {
      body.specialization = document.getElementById("specialization").value;
      body.feesTeleconsult = document.getElementById("feesTeleconsult").value;
      body.feesVisit = document.getElementById("feesVisit").value;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Please login.");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      alert("Error connecting to server");
    }
  });
}

// ------------------ DASHBOARD ------------------
async function loadDashboard() {
  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userInfo").innerHTML = `
    <p><b>Name:</b> ${user.firstName} ${user.lastName}</p>
    <p><b>Email:</b> ${user.email}</p>
    <p><b>Role:</b> ${user.role}</p>
  `;

  const appointmentsDiv = document.getElementById("appointments");
  try {
    const res = await fetch(`${API_BASE}/appointment/my`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    appointmentsDiv.innerHTML = "";

    data.forEach(appt => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <p><b>Doctor:</b> ${appt.doctor?.firstName || ""} ${appt.doctor?.lastName || ""}</p>
        <p><b>Type:</b> ${appt.type}</p>
        <p><b>Status:</b> ${appt.status}</p>
        <p><b>Date:</b> ${appt.date || "-"}</p>
        <p><b>Time:</b> ${appt.time || "-"}</p>
      `;
      appointmentsDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading appointments", err);
  }
}

// ------------------ BOOKING PAGE ------------------
async function initBooking() {
  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get("doctorId");
  if (!doctorId) {
    alert("No doctor selected");
    window.location.href = "index.html";
    return;
  }

  const doctorCard = document.getElementById("doctorCard");
  const appointmentType = document.getElementById("appointmentType");
  const onlineFields = document.getElementById("onlineFields");
  const inPersonFields = document.getElementById("inPersonFields");
  const timeSlotSelect = document.getElementById("timeSlot");
  const bookForm = document.getElementById("bookForm");
  const bookMsg = document.getElementById("bookMsg");

  // fetch doctor info
  try {
    const res = await fetch(`${API_BASE}/doctor/${doctorId}`);
    const doc = await res.json();
    doctorCard.innerHTML = `
      <h2>Dr. ${doc.firstName} ${doc.lastName}</h2>
      <p><b>Specialization:</b> ${doc.specialization || "General"}</p>
      <p><b>Location:</b> ${doc.district}, ${doc.state}</p>
      <p><b>Online Fee:</b> ₹${doc.feesTeleconsult || "-"}</p>
      <p><b>Visit Fee:</b> ₹${doc.feesVisit || "-"}</p>
    `;

    // mock slots (replace with backend slots if available)
    timeSlotSelect.innerHTML = `
      <option value="9:00-9:30">9:00 - 9:30 AM</option>
      <option value="10:00-10:30">10:00 - 10:30 AM</option>
      <option value="11:00-11:30">11:00 - 11:30 AM</option>
    `;
  } catch (err) {
    console.error("Error loading doctor info", err);
  }

  // toggle fields
  appointmentType.addEventListener("change", () => {
    if (appointmentType.value === "Online") {
      onlineFields.style.display = "block";
      inPersonFields.style.display = "none";
    } else if (appointmentType.value === "InPerson") {
      inPersonFields.style.display = "block";
      onlineFields.style.display = "none";
    } else {
      onlineFields.style.display = "none";
      inPersonFields.style.display = "none";
    }
  });

  // submit form
  bookForm.addEventListener("submit", async e => {
    e.preventDefault();
    const type = appointmentType.value;
    let body = { doctorId, type };

    if (type === "Online") {
      body.time = timeSlotSelect.value;
    } else {
      body.date = document.getElementById("visitDate").value;
      body.time = document.getElementById("visitTime").value;
      body.animalType = document.getElementById("animalType").value;
      body.symptoms = document.getElementById("symptoms").value;
      body.village = document.getElementById("village").value;
    }

    try {
      const res = await fetch(`${API_BASE}/appointment/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        bookMsg.textContent = "Appointment booked successfully!";
        bookForm.reset();
      } else {
        bookMsg.textContent = data.message || "Booking failed";
        bookMsg.style.color = "red";
      }
    } catch (err) {
      bookMsg.textContent = "Error connecting to server";
      bookMsg.style.color = "red";
    }
  });
}
