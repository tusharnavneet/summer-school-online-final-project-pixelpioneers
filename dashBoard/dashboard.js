// dashboard.js
import { showToast, checkAuth, logout } from "../utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verify Authentication
  const user = await checkAuth();
  if (!user) return;

  // 2. Display User Profile
  const emailDisplay = document.getElementById("emailDisplay");
  const profileBtn = document.getElementById("profile");
  if (emailDisplay && profileBtn) {
    profileBtn.addEventListener("click", () => {
      emailDisplay.style.display = emailDisplay.style.display === "none" ? "block" : "none";
      if (emailDisplay.style.display === "block") {
        emailDisplay.textContent = `Welcome, ${user.name} (${user.email})`;
      }
    });
    // Navigate to profile page on double-click
    profileBtn.addEventListener("dblclick", () => {
      window.location.href = "./profile.html";
    });
    // Keyboard support for profile page navigation
    profileBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        window.location.href = "./profile.html";
      }
    });
  }

  // 3. Fetch Progress (Placeholder)
  const progressPercent = document.getElementById("progressPercent");
  try {
    const response = await fetch("http://localhost:5000/api/auth/progress", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (response.ok) {
      const { completion } = await response.json();
      progressPercent.textContent = `${completion || 75}% Complete`;
    } else {
      progressPercent.textContent = "75% Complete";
    }
  } catch (error) {
    progressPercent.textContent = "75% Complete";
    console.error("Error fetching progress:", error);
  }

  // 4. Logout Button
  // const logoutBtn = document.getElementById("logoutBtn");
  // if (logoutBtn) {
  //   logoutBtn.addEventListener("click", logout);
  // }

  const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("profilePic");
                    window.location.href = "../index.html";
                }
        });
    }

  // 5. Navigation for Test Sections
  const sections = [
    { id: "section1", path: "../syllabus/syllabus.html" },
    { id: "section2", path: "../chaptermock/chapter.html" },
    { id: "section3", path: "../subjectmock/subject.html" },
    { id: "section4", path: "../pyqmock/pyq.html" },
    { id: "section5", path: "../fullmock/fullmock.html" },
  ];

  sections.forEach(({ id, path }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", () => {
        window.location.href = path;
      });
      element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          window.location.href = path;
        }
      });
    }
  });
});
// Add this to dashboard.js
async function loadProgressData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch('http://localhost:5000/api/progress', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load progress');

    // Update summary cards
    document.getElementById('tests-taken').textContent = data.overallStats.totalTestsTaken;
    document.getElementById('average-score').textContent = `${Math.round(data.overallStats.averageScore)}%`;
    document.getElementById('best-score').textContent = `${Math.round(data.overallStats.bestScore)}%`;

    // Update recent tests table
    const tbody = document.querySelector('#recent-tests tbody');
    tbody.innerHTML = '';
    
    // Show only the 5 most recent tests
    const recentTests = data.testProgress.slice(0, 5).reverse();
    
    recentTests.forEach(test => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${test.testId}</td>
        <td>${new Date(test.dateTaken).toLocaleDateString()}</td>
        <td>${test.score}/${test.totalMarks}</td>
        <td>${Math.round(test.accuracy)}%</td>
      `;
      tbody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading progress data:', error);
    // You might want to show an error message to the user
  }
}

// Add event listener for the progress link
document.getElementById('progress-link')?.addEventListener('click', function(e) {
  e.preventDefault();
  
  // Hide other content sections
  document.querySelectorAll('.main-content > div').forEach(div => {
    div.style.display = 'none';
  });
  
  // Show progress dashboard
  const progressDashboard = document.getElementById('progress-dashboard');
  if (progressDashboard) {
    progressDashboard.style.display = 'block';
    loadProgressData();
  }
});