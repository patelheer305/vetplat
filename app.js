<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Dashboard - VetConnect</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <div class="topbar">
    <h1>VetConnect</h1>
    <nav>
      <a href="index.html">Home</a>
      <a href="#" id="logoutBtn">Logout</a>
    </nav>
  </div>

  <div class="container">
    <h2>Dashboard</h2>
    <div id="userInfo" class="card"></div>

    <!-- Section for Farmers -->
    <div id="farmerSection" style="display:none;">
      <h3>Your Appointments</h3>
      <div id="appointments" class="cards"></div>
    </div>

    <!-- Section for Doctors -->
    <div id="doctorSection" style="display:none;">
      <h3>Appointment Requests</h3>
      <div id="doctorAppointments" class="cards"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
