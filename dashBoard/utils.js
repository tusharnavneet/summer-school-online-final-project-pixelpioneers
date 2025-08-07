// utils.js
const API_URL = "http://localhost:5000/api";

// Show toast notification (assumes Toastify.js is included)
function showToast(message, type = "error") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: type === "success" ? "#4cc9f0" : "#f72585",
  }).showToast();
}

// Check if user is authenticated
async function checkAuth(redirect = true) {
  const token = localStorage.getItem("token");
  if (!token && redirect) {
    showToast("Please log in to continue.");
    setTimeout(() => (window.location.href = "../index.html"), 2000);
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      localStorage.removeItem("token");
      if (redirect) {
        showToast("Session expired. Please log in again.");
        setTimeout(() => (window.location.href = "../index.html"), 2000);
      }
      return null;
    }
    return result.user; // { id, name, email }
  } catch (error) {
    showToast("Error verifying session.");
    if (redirect) {
      setTimeout(() => (window.location.href = "../index.html"), 2000);
    }
    return null;
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  showToast("Logged out successfully.", "success");
  setTimeout(() => (window.location.href = "../index.html"), 2000);
}

export { showToast, checkAuth, logout };