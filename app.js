const API_BASE = "https://vetplat-backend.onrender.com/api"; // adjust if needed

// Load appointments on dashboard
async function loadAppointments() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location = "login.html");

  const res = await fetch(`${API_BASE}/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const user = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("appointments");
  if (!container) return;

  container.innerHTML = "";

  data.forEach(appt => {
    const card = document.createElement("div");
    card.className = "card";

    let details = `
      <p><b>Date:</b> ${appt.date} ${appt.time}</p>
      <p><b>Status:</b> ${appt.status}</p>
    `;

    if (user.role === "Farmer") {
      details += `<p><b>Doctor:</b> ${appt.doctorName}</p>`;
      if (appt.status === "Pending" || appt.status === "Confirmed") {
        details += `<button onclick="cancelAppointment('${appt.id}')">Cancel</button>`;
      }
    } else if (user.role === "Doctor") {
      details += `<p><b>Farmer:</b> ${appt.farmerName}</p>`;
      if (appt.status === "Pending") {
        details += `<button onclick="updateAppointmentStatus('${appt.id}','Confirmed')">Confirm</button>`;
      }
      if (appt.status === "Confirmed") {
        details += `<button onclick="updateAppointmentStatus('${appt.id}','Completed')">Complete</button>`;
      }
      if (appt.status !== "Cancelled" && appt.status !== "Completed") {
        details += `<button onclick="updateAppointmentStatus('${appt.id}','Cancelled')">Cancel</button>`;
      }
    }

    card.innerHTML = details;
    container.appendChild(card);
  });
}

// Doctor updates appointment
async function updateAppointmentStatus(id, status) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/appointments/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  loadAppointments();
}

// Farmer cancels appointment
async function cancelAppointment(id) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/appointments/${id}/cancel`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadAppointments();
}

// On dashboard load
if (document.getElementById("appointments")) {
  loadAppointments();
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location = "index.html";
  };
}
