document.addEventListener('DOMContentLoaded', function() {
    const subjectCards = document.querySelectorAll('.subject-card');
    const startTestBtn = document.getElementById('startTestBtn');
    const selectionInfo = document.getElementById('selectionInfo');
    const testOptionsSection = document.getElementById('testOptions');
    
    let selectedTestPage = null;

    // Add click event to each subject card
    subjectCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            subjectCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Get the test page URL
            selectedTestPage = this.getAttribute('data-test-page');
            
            // Update the selection info
            const subjectName = this.querySelector('h3').textContent;
            selectionInfo.textContent = `Selected: ${subjectName}`;
            
            // Enable the start test button
            startTestBtn.disabled = false;
            
            // Scroll to the test options section
            testOptionsSection.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Start test button click handler
    startTestBtn.addEventListener('click', function() {
        if (selectedTestPage) {
            // Redirect to the specific test page
            window.location.href = selectedTestPage;
        }
    });
});
const dashboard = document.getElementById("dashboardBtn");
if (dashboard) {
    dashboard.addEventListener('click', function() {
        // Save any necessary state here
        // Then redirect
        window.location.href = '../dashBoard/dashboard.html';
    });
}
