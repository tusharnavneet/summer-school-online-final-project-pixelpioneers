  // Toggle subject cards
  document.querySelectorAll('.subject-title').forEach(title => {
    title.addEventListener('click', () => {
        const card = title.parentElement;
        document.querySelectorAll('.subject-card').forEach(c => {
            if (c !== card) {
                c.classList.remove('active');
            }
        });
        card.classList.toggle('active');
    });
});

// Select chapter and update main content
document.querySelectorAll('.chapter-item').forEach(chapter => {
    chapter.addEventListener('click', (e) => {
        if (!e.target.classList.contains('chapter-item')) return;
        
        e.preventDefault();
        
        document.querySelectorAll('.chapter-item').forEach(c => {
            c.classList.remove('active');
        });
        chapter.classList.add('active');
        
        // Update main content with selected chapter info
        const subjectCard = chapter.closest('.subject-card');
        const subject = subjectCard.querySelector('.subject-title span').textContent;
        const chapterName = chapter.textContent;
        const chapterLink = chapter.getAttribute('href');
        
        document.querySelector('.test-info h2').innerHTML = 
            `<i class="${subjectCard.querySelector('.subject-icon').className}"></i> ${subject}`;
        document.querySelector('.test-info p').textContent = `Chapter: ${chapterName}`;
        
        // Update Start Test button link
        document.querySelector('.test-controls .btn-primary').setAttribute('href', chapterLink);
        
        // Update syllabus link (assuming a pattern)
        const syllabusLink = chapterLink.replace('tests/', 'syllabus/');
        document.querySelector('.test-controls .btn-outline').setAttribute('href', syllabusLink);
        
        // Update test stats (in a real app, you'd fetch this data)
        const questions = Math.floor(Math.random() * 10) + 10;
        const marks = questions + Math.floor(Math.random() * 10);
        const minutes = Math.floor(marks * 1.2);
        
        document.querySelectorAll('.stat-value')[0].textContent = questions;
        document.querySelectorAll('.stat-value')[1].textContent = marks;
        document.querySelectorAll('.stat-value')[2].textContent = minutes;
        
        // Update test description based on chapter
        const descriptions = {
            "Number Systems": "Test your understanding of number systems including binary, hexadecimal representations, arithmetic operations, and conversions.",
            "Digital Logic": "Evaluate your knowledge of logic gates, Boolean algebra, combinational and sequential circuits.",
            // Add more descriptions for other chapters
        };
        
        document.querySelector('.test-info p:last-child').textContent = 
            descriptions[chapterName] || "Comprehensive test covering all aspects of this chapter.";
    });
});

// Initialize with first chapter active
document.querySelector('.chapter-item.active').click();
const dashboard = document.getElementById("dashboardBtn");
if (dashboard) {
    dashboard.addEventListener('click', function() {
        // Save any necessary state here
        // Then redirect
        window.location.href = '../dashBoard/dashboard.html';
    });
}