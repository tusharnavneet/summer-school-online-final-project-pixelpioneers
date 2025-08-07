document.addEventListener("DOMContentLoaded", async () => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (!token || !userEmail) {
        window.location.href = "../index.html";
        return;
    }

    // DOM Elements
    const profileImage = document.getElementById("profileImage");
    const profileUpload = document.getElementById("profileUpload");
    const uploadProgress = document.getElementById("uploadProgress");
    const profileName = document.getElementById("profileName");
    const editNameBtn = document.getElementById("editNameBtn");
    const profileForm = document.getElementById("profileForm");
    const editName = document.getElementById("editName");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const profileDetails = document.getElementById("profileDetails");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const passwordModal = document.getElementById("passwordModal");
    const closeModal = document.querySelector(".close-modal");
    const passwordForm = document.getElementById("passwordForm");

    // Fetch and display user profile
    async function loadProfile() {
        try {
            const response = await fetch("http://localhost:5000/api/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server did not return a valid JSON response");
            }

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("userName", result.user.name);
                localStorage.setItem("profilePic", result.user.profilePicUrl);

                profileName.textContent = result.user.name || "User";
                document.getElementById("profileEmail").textContent = result.user.email;
                document.getElementById("detailName").textContent = result.user.name || "Not available";
                document.getElementById("detailEmail").textContent = result.user.email;
                profileImage.src = result.user.profilePicUrl || "../profile-placeholder.png";

                const createdAt = new Date(result.user.createdAt);
                document.getElementById("profileJoined").textContent = createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            } else {
                throw new Error(result.message || "Failed to load profile");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            Toastify({
                text: error.message || "Failed to load profile",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff4444",
            }).showToast();
        }
    }

    // Load profile on page load
    await loadProfile();

    // Profile picture upload
    if (profileUpload) {
        profileUpload.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match("image.*")) {
                Toastify({
                    text: "Please select a valid image file (JPEG, PNG, GIF).",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                Toastify({
                    text: "Image size should be less than 2MB.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
                return;
            }

            try {
                const formData = new FormData();
                formData.append("profilePic", file);

                if (uploadProgress) {
                    uploadProgress.style.display = "block";
                    uploadProgress.value = 0;
                }

                const response = await fetch("http://localhost:5000/api/auth/profile", {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (uploadProgress) {
                    const interval = setInterval(() => {
                        uploadProgress.value += 10;
                        if (uploadProgress.value >= 90) clearInterval(interval);
                    }, 100);
                }

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server did not return a valid JSON response");
                }

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem("profilePic", result.user.profilePicUrl);
                    profileImage.src = result.user.profilePicUrl + `?t=${Date.now()}`;
                    if (uploadProgress) {
                        uploadProgress.value = 100;
                        setTimeout(() => (uploadProgress.style.display = "none"), 500);
                    }
                    Toastify({
                        text: "Profile picture updated successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#00cc00",
                    }).showToast();
                } else {
                    throw new Error(result.message || "Failed to update profile picture");
                }
            } catch (error) {
                console.error("Error uploading profile picture:", error);
                if (uploadProgress) uploadProgress.style.display = "none";
                Toastify({
                    text: error.message || "Failed to update profile picture",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
            }
        });
    }

    // Name editing
    if (editNameBtn) {
        editNameBtn.addEventListener("click", () => {
            profileDetails.style.display = "none";
            profileForm.style.display = "block";
            editName.value = profileName.textContent;
            editName.focus();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            profileForm.style.display = "none";
            profileDetails.style.display = "block";
        });
    }

    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const newName = editName.value.trim();
            if (!newName) {
                Toastify({
                    text: "Please enter a valid name",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/api/auth/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: newName }),
                });

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server did not return a valid JSON response");
                }

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem("userName", newName);
                    profileName.textContent = newName;
                    document.getElementById("detailName").textContent = newName;
                    profileForm.style.display = "none";
                    profileDetails.style.display = "block";
                    Toastify({
                        text: "Name updated successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#00cc00",
                    }).showToast();
                } else {
                    throw new Error(result.message || "Failed to update name");
                }
            } catch (error) {
                console.error("Error updating name:", error);
                Toastify({
                    text: error.message || "Failed to update name",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
            }
        });
    }

    // Password change functionality
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", () => {
            passwordModal.style.display = "block";
        });
    }

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            passwordModal.style.display = "none";
        });
    }

    window.addEventListener("click", (event) => {
        if (event.target === passwordModal) {
            passwordModal.style.display = "none";
        }
    });

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById("currentPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (newPassword !== confirmPassword) {
                Toastify({
                    text: "New passwords do not match!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
                return;
            }

            if (newPassword.length < 6) {
                Toastify({
                    text: "Password must be at least 6 characters long!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/api/auth/password", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
                });

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server did not return a valid JSON response");
                }

                const result = await response.json();

                if (response.ok) {
                    Toastify({
                        text: "Password changed successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#00cc00",
                    }).showToast();
                    passwordForm.reset();
                    passwordModal.style.display = "none";
                } else {
                    Toastify({
                        text: result.message || "Failed to change password",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ff4444",
                    }).showToast();
                }
            } catch (error) {
                console.error("Error changing password:", error);
                Toastify({
                    text: error.message || "Error changing password. Please try again.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff4444",
                }).showToast();
            }
        });
    }

    // Logout functionality
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
});