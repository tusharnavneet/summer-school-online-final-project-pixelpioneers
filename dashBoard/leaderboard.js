document.addEventListener('DOMContentLoaded', async () => {
    // Authentication check
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to view the leaderboard');
        window.location.href = '/login.html';
        return;
    }

    // DOM elements
    const leaderboardBody = document.getElementById('leaderboard-body');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // Format percentage for display
    const formatPercentage = (value) => {
        return `${Math.round(value)}%`;
    };

    // Enhanced fetch with error handling
    const fetchLeaderboard = async () => {
        try {
            leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</td></tr>';
            
            const response = await fetch('http://localhost:5000/api/auth/leaderboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch leaderboard');
            }

            const data = await response.json();
            
            // Validate response structure
            if (!data || !data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid leaderboard data format');
            }

            return data.data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };

    // Display leaderboard data
    const displayLeaderboard = (leaderboard) => {
        if (!leaderboard || leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found on leaderboard</td></tr>';
            return;
        }

        leaderboardBody.innerHTML = '';
        const currentUserId = localStorage.getItem('userId');
        
        leaderboard.forEach((user, index) => {
            const row = document.createElement('tr');
            
            // Highlight top 3 positions
            if (index < 3) {
                row.classList.add(`top-${index + 1}`);
            }
            
            // Highlight current user
            if (user._id === currentUserId) {
                row.classList.add('current-user');
            }

            row.innerHTML = `
                <td class="rank-cell">
                    ${index + 1}
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                </td>
                <td>
                    
                    ${user.name || 'Anonymous'}
                    ${user._id === currentUserId ? '<span class="you-badge">(You)</span>' : ''}
                </td>
                <td>${user.overallStats?.totalTestsTaken || 0}</td>
                <td class="user-score">${formatPercentage(user.overallStats?.averageScore || 0)}</td>
                <td class="user-score">${formatPercentage(user.overallStats?.bestScore || 0)}</td>
            `;

            leaderboardBody.appendChild(row);
        });
    };

    // Load leaderboard with error handling
    const loadLeaderboard = async () => {
        try {
            const leaderboard = await fetchLeaderboard();
            displayLeaderboard(leaderboard);
            
            // Cache the data
            localStorage.setItem('leaderboardCache', JSON.stringify(leaderboard));
        } catch (error) {
            console.error('Error:', error);
            
            // Try to use cached data
            const cached = localStorage.getItem('leaderboardCache');
            if (cached) {
                displayLeaderboard(JSON.parse(cached));
                showToast('Using cached data. Could not refresh leaderboard.', 'warning');
                return;
            }
            
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> ${error.message || 'Failed to load leaderboard'}
                    </td>
                </tr>
            `;
            showToast(error.message || 'Failed to load leaderboard', 'error');
        }
    };

    // Toast notification
    const showToast = (message, type = 'success') => {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'error' ? "#dc3545" : type === 'warning' ? "#ffc107" : "#28a745",
        }).showToast();
    };

    // Event listeners
    refreshBtn?.addEventListener('click', () => {
        loadLeaderboard();
        showToast('Refreshing leaderboard...', 'info');
    });

    // logoutBtn?.addEventListener('click', () => {
    //     if (confirm('Are you sure you want to logout?')) {
    //         localStorage.clear();
    //         window.location.href = '../index.html';
    //     }
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
    loadLeaderboard();
});