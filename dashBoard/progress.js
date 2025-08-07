document.addEventListener('DOMContentLoaded', async () => {
    // Authentication check
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to view your progress');
      window.location.href = '/login.html';
      return;
    }
  
    // DOM elements
    const testsTakenEl = document.getElementById('tests-taken');
    const averageScoreEl = document.getElementById('average-score');
    const bestScoreEl = document.getElementById('best-score');
    const recentTestsEl = document.getElementById('recent-tests');
    const progressPercentEl = document.getElementById('progressPercent');
    const logoutBtn = document.getElementById('logoutBtn');
  
    // Format time display
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  
    // Fetch progress data
    const fetchProgressData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/progress', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch progress');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    };
  
    // Display progress data
    const displayProgress = (data) => {
      const { testProgress, overallStats } = data;
  
      // Update summary cards
      testsTakenEl.textContent = overallStats.totalTestsTaken;
      averageScoreEl.textContent = `${Math.round(overallStats.averageScore)}%`;
      bestScoreEl.textContent = `${Math.round(overallStats.bestScore)}%`;
  
      // Update progress table
      recentTestsEl.innerHTML = testProgress.length > 0 
        ? testProgress.slice(0, 100).map(test => `
            <tr>
              <td>${test.testType}</td>
              <td>${new Date(test.dateTaken).toLocaleDateString()}</td>
              <td>${test.score.toFixed(1)}/${test.totalMarks}</td>
              <td>${test.accuracy.toFixed(1)}%</td>
              <td>${formatTime(test.timeSpent)}</td>
              
            </tr>
          `).join('')
        : '<tr><td colspan="6">No tests taken yet</td></tr>';
  
      // Update progress indicator
      if (progressPercentEl) {
        progressPercentEl.textContent = `${Math.round(overallStats.averageScore)}% Complete`;
      }
    };
  
    // Load and display progress
    const loadProgress = async () => {
      try {
        // Try to load from cache first
        const cached = localStorage.getItem('progressCache');
        if (cached) {
          displayProgress(JSON.parse(cached));
        }
  
        // Fetch fresh data
        const { data } = await fetchProgressData();
        displayProgress(data);
        
        // Update cache
        localStorage.setItem('progressCache', JSON.stringify(data));
      } catch (error) {
        console.error('Error loading progress:', error);
        
        // If unauthorized, redirect to login
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          localStorage.removeItem('token');
          window.location.href = '/login.html';
          return;
        }
  
        // Show error message
        recentTestsEl.innerHTML = '<tr><td colspan="6">Failed to load progress data</td></tr>';
        alert(error.message || 'Failed to load progress data');
      }
    };
  
    // Logout handler
    // logoutBtn?.addEventListener('click', () => {
    //   if (confirm('Are you sure you want to logout?')) {
    //     localStorage.removeItem('token');
    //     localStorage.removeItem('progressCache');
    //     window.location.href = '../index.html';
    //   }
    // });
   // const logoutBtn = document.getElementById("logoutBtn");
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
  
    // Initialize
    loadProgress();
  });