// Clear the content of main-content when any sidebar link is clicked (except for syllabus)
function clearContent(excludeId = '') {
    const sections = document.querySelectorAll('.main-content > div');
    sections.forEach(section => {
        if (section.id !== excludeId) {
            section.style.display = 'none';
        }
    });
}

// Reference elements
const mockTestButtons = [
    document.getElementById('mocktest1'),
    document.getElementById('mocktest2'),
    document.getElementById('mocktest3'),
    document.getElementById('mocktest4'),
    document.getElementById('mocktest5'),
    document.getElementById('mocktest6'),
    document.getElementById('mocktest7'),
    document.getElementById('mocktest8'),
    document.getElementById('mocktest9'),
    document.getElementById('mocktest10') 
];

const instructionSection = document.getElementById('instruction-section');
const TOTAL_QUESTIONS = 25;
const TOTAL_MARKS = 40;
let selectedQuestions = [];
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let timerInterval;
let userAnswers = {};
let testStarted = false;
let sidebarVisible = true;
let questionStartTime = null;
let timeSpentPerQuestion = Array(TOTAL_QUESTIONS).fill(0);

// Function to reset active state of mock test buttons
function resetMockTestButtons() {
    mockTestButtons.forEach(button => {
        if (button) {
            button.classList.remove('active');
        }
    });
}

// Fetch questions from JSON
async function fetchQuestions() {
    try {
        const response = await fetch('../../questionbank/engineering_math.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching questions:', error);
        return { questions: [] };
    }
}

// Function to select exactly 25 questions totaling exactly 40 marks
function getRandomQuestions(questionsData) {
    const validQuestions = questionsData.filter(q => q.marks <= TOTAL_MARKS);
    
    let bestCombination = [];
    let closestDiff = Infinity;
    let bestCount = 0;
    
    for (let attempt = 0; attempt < 500; attempt++) {
        const shuffled = [...validQuestions].sort(() => 0.5 - Math.random());
        
        let currentCombination = [];
        let currentTotal = 0;
        let count = 0;
        
        for (const question of shuffled) {
            if (count >= TOTAL_QUESTIONS) break;
            if (currentTotal + question.marks <= TOTAL_MARKS) {
                currentCombination.push(question);
                currentTotal += question.marks;
                count++;
                
                if (count === TOTAL_QUESTIONS && currentTotal === TOTAL_MARKS) {
                    return currentCombination;
                }
            }
        }
        
        const diff = Math.abs(TOTAL_MARKS - currentTotal);
        if (diff < closestDiff || (diff === closestDiff && count > bestCount)) {
            closestDiff = diff;
            bestCombination = currentCombination;
            bestCount = count;
        }
    }
    
    if (bestCombination.length === TOTAL_QUESTIONS && closestDiff <= 2) {
        for (let i = 0; i < bestCombination.length; i++) {
            for (const question of validQuestions) {
                if (!bestCombination.includes(question)) {
                    const newTotal = bestCombination.reduce((sum, q) => sum + q.marks, 0) - bestCombination[i].marks + question.marks;
                    if (newTotal === TOTAL_MARKS) {
                        bestCombination[i] = question;
                        return bestCombination;
                    }
                }
            }
        }
    }
    
    console.log(`Using combination with ${bestCombination.length} questions totaling ${bestCombination.reduce((sum, q) => sum + q.marks, 0)} marks`);
    return bestCombination;
}

function displayCurrentQuestion() {
    if (questionStartTime !== null && currentQuestionIndex < timeSpentPerQuestion.length) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        timeSpentPerQuestion[currentQuestionIndex] += timeSpent;
    }

    const questionContainer = document.getElementById('question-container');
    if (!questionContainer || !selectedQuestions[currentQuestionIndex]) return;

    questionStartTime = Date.now();

    const question = selectedQuestions[currentQuestionIndex];
    let negativeMarking = 'Negative: 0';
    let hasPenalty = false;
    
    if (question.type !== "numerical" && !Array.isArray(question.answer)) {
        negativeMarking = `Negative: -${(question.marks / 3).toFixed(2)}`;
        hasPenalty = true;
    }

    let questionType = '';
    let typeClass = '';
    if (question.type === "numerical") {
        questionType = 'Numerical';
        typeClass = 'data-type="Numerical"';
    } else {
        questionType = Array.isArray(question.answer) ? 'MSQ (Multiple Select)' : 'MCQ (Single Correct)';
        typeClass = Array.isArray(question.answer) ? 'data-type="MSQ"' : 'data-type="MCQ"';
    }

    questionContainer.innerHTML = `
        <div class="question-header">
            <div class="question-meta">
                <div class="question-info">
                    <span class="question-number">Question ${currentQuestionIndex + 1}</span>
                    <span class="question-type" ${typeClass}>${questionType}</span>
                </div>
                <div class="marks-info">
                    <span class="question-marks">Marks: +${question.marks}</span>
                    <span class="negative-marks" ${hasPenalty ? 'data-has-penalty="true"' : ''}>${negativeMarking}</span>
                </div>
            </div>
            ${question.image ? `
                <div class="image-container">
                    <img src="${getImagePath(question.image)}" 
                         class="question-image" 
                         alt="Question diagram"
                         onerror="handleImageError(this)"
                         loading="lazy">
                    <div class="image-error" style="display: none;">
                        <i class="fas fa-image"></i> Image unavailable
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="question-body">
            <p class="question-text">${question.question}</p>
            <div class="answer-options">
                ${getAnswerOptionsHtml(question)}
            </div>
        </div>
    `;

    restoreSelections(question);
    toggleButtons();
    updateProgress();

    // Scroll to the top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Helper function to construct correct image path
function getImagePath(imageName) {
    if (/^(https?:|data:)/.test(imageName)) {
        return imageName;
    }
    return `../../questionbank/${imageName}`;
}

// Error handler for images
function handleImageError(imgElement) {
    imgElement.style.display = 'none';
    const errorElement = imgElement.parentElement.querySelector('.image-error');
    if (errorElement) {
        errorElement.style.display = 'flex';
    }
}

function getAnswerOptionsHtml(question) {
    if (question.type === "numerical") {
        return `
            <input type="number" 
                   class="numerical-input" 
                   value="${userAnswers[currentQuestionIndex] || ''}"
                   placeholder="Enter numerical answer">
        `;
    }
    
    return question.options.map((option, i) => `
        <div class="option-container">
            <label class="option-label">
                <input type="${Array.isArray(question.answer) ? 'checkbox' : 'radio'}" 
                       name="question${currentQuestionIndex}" 
                       value="${option}"
                       class="option-input">
                <span class="option-text">${option}</span>
            </label>
        </div>
    `).join('');
}

function restoreSelections(question) {
    const currentAnswer = userAnswers[currentQuestionIndex];
    if (!currentAnswer) return;

    if (question.type === "numerical") {
        const input = document.querySelector('.numerical-input');
        if (input) input.value = currentAnswer;
    } else {
        const inputs = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`);
        inputs.forEach(input => {
            if (Array.isArray(currentAnswer)) {
                input.checked = currentAnswer.includes(input.value);
            } else {
                input.checked = input.value === currentAnswer;
            }
        });
    }
}

function toggleButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex === selectedQuestions.length - 1;
    }
}

function updateProgress() {
    const progress = document.getElementById('progress');
    if (progress) {
        progress.textContent = `Question ${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
    }
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const percentage = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
        progressBar.style.width = `${percentage}%`;
    }
    
    const marksCounter = document.getElementById('marks-counter');
    if (marksCounter) {
        const answeredCount = Object.keys(userAnswers).length;
        marksCounter.textContent = `Answered: ${answeredCount}/${selectedQuestions.length}`;
    }
}

function saveAnswer() {
    const question = selectedQuestions[currentQuestionIndex];
    if (!question) return;

    if (question.type === "numerical") {
        const input = document.querySelector('.numerical-input');
        if (input) userAnswers[currentQuestionIndex] = input.value.trim();
    } else {
        const inputs = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]:checked`);
        userAnswers[currentQuestionIndex] = Array.isArray(question.answer) 
            ? Array.from(inputs).map(input => input.value)
            : inputs[0]?.value || null;
    }
    updateProgress();
}

const nextBtn = document.getElementById('nextBtn');
if (nextBtn) {
    nextBtn.addEventListener('click', function() {
        if (questionStartTime !== null) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
            timeSpentPerQuestion[currentQuestionIndex] += timeSpent;
            questionStartTime = Date.now();
        }
        if (currentQuestionIndex < selectedQuestions.length - 1) {
            currentQuestionIndex++;
            displayCurrentQuestion();
        }
    });
}

const nextsaveBtn = document.getElementById('nextsaveBtn');
if (nextsaveBtn) {
    nextsaveBtn.addEventListener('click', function() {
        saveAnswer();
        if (questionStartTime !== null) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
            timeSpentPerQuestion[currentQuestionIndex] += timeSpent;
            questionStartTime = Date.now();
        }
        if (currentQuestionIndex < selectedQuestions.length - 1) {
            currentQuestionIndex++;
            displayCurrentQuestion();
        }
    });
}

const prevBtn = document.getElementById('prevBtn');
if (prevBtn) {
    prevBtn.addEventListener('click', function() {
        saveAnswer();
        if (questionStartTime !== null) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
            timeSpentPerQuestion[currentQuestionIndex] += timeSpent;
            questionStartTime = Date.now();
        }
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayCurrentQuestion();
        }
    });
}

const submitBtn = document.getElementById('submitBtn');
if (submitBtn) {
    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveAnswer();
        
        if (questionStartTime !== null) {
            const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
            timeSpentPerQuestion[currentQuestionIndex] += timeSpent;
        }
        
        const unansweredCount = selectedQuestions.reduce((count, _, index) => {
            return count + (userAnswers[index] === undefined || userAnswers[index] === null ? 1 : 0);
        }, 0);
        
        let confirmMessage = 'Are you sure you want to submit the test?';
        if (unansweredCount > 0) {
            confirmMessage += `\n\nYou have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}.`;
        }
        
        if (confirm(confirmMessage)) {
            clearInterval(timerInterval);
            calculateResult();
        }
    });
}

function validateAnswer(userAnswer, correctAnswer, questionType) {
    if (userAnswer === null || userAnswer === undefined) return false;
    
    if (questionType === "numerical") {
        const userValue = parseFloat(userAnswer);
        const correctValue = parseFloat(correctAnswer);
        return !isNaN(userValue) && Math.abs(userValue - correctValue) < 0.001;
    }
    
    if (Array.isArray(correctAnswer)) {
        const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        return userArr.sort().join(',') === correctAnswer.sort().join(',');
    }
    
    return userAnswer.toString() === correctAnswer.toString();
}

async function calculateResult() {
    correctAnswersCount = 0;
    let totalMarks = 0;
    let totalMaxMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    const questionResults = [];

    selectedQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = validateAnswer(userAnswer, question.answer, question.type);
        let marksObtained = 0;
        
        if (isCorrect) {
            correctAnswersCount++;
            marksObtained = question.marks;
        } else if (userAnswer !== null && userAnswer !== undefined) {
            if (question.type === "numerical") {
                marksObtained = 0;
            } else if (Array.isArray(question.answer)) {
                marksObtained = 0;
            } else {
                marksObtained = -(question.marks / 3);
            }
        }
        
        totalMarks += marksObtained;
        
        questionResults.push({
            number: index + 1,
            attempted: userAnswer !== null && userAnswer !== undefined,
            correct: isCorrect,
            userAnswer: userAnswer,
            correctAnswer: question.answer,
            timeSpent: timeSpentPerQuestion[index] || 0,
            marks: question.marks,
            marksObtained: marksObtained,
            type: question.type,
            isMultiple: Array.isArray(question.answer)
        });
    });

    const attemptedCount = questionResults.filter(q => q.attempted).length;
    const accuracy = attemptedCount > 0 
        ? ((correctAnswersCount / attemptedCount) * 100).toFixed(2)
        : 0;

    const testId = mockTestButtons.find(btn => btn?.classList.contains('active'))?.id || 'mocktest1';
    const totalTimeSpent = timeSpentPerQuestion.reduce((sum, time) => sum + time, 0);

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch('http://localhost:5000/api/progress/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                testType: 'SUBJECT-MOCK[Engineering Maths]',
                testId,
                score: totalMarks,
                totalMarks: totalMaxMarks,
                accuracy: parseFloat(accuracy),
                correctAnswers: correctAnswersCount,
                attempted: attemptedCount,
                timeSpent: totalTimeSpent,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            console.error('Error saving progress:', result.message);
            alert('Failed to save progress. Please try again.');
        }
    } catch (error) {
        console.error('Error saving progress:', error);
        alert('Error saving progress. Please check your connection.');
    }

    displayResult(questionResults, totalMarks, totalMaxMarks);
}

function displayResult(questionResults, totalMarks, totalMaxMarks) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebarVisible) {
        sidebar.style.display = 'block';
        sidebarVisible = true;
    }
    
    const testSection = document.getElementById('test-section');
    if (testSection) testSection.style.display = 'none';
    
    const resultSection = document.getElementById('result-section');
    if (!resultSection) return;
    
    const attemptedCount = questionResults.filter(q => q.attempted).length;
    const accuracy = attemptedCount > 0 
        ? ((correctAnswersCount / attemptedCount) * 100).toFixed(2)
        : 0;
    
    const questionsBreakdown = questionResults.map(question => `
        <div class="question-result ${question.attempted ? (question.correct ? 'correct' : 'incorrect') : 'unattempted'}">
            <div class="question-meta">
                <div>
                    <span class="question-number">Q${question.number}</span>
                    <span class="question-type" ${question.isMultiple ? 'data-type="MSQ"' : question.type === 'numerical' ? 'data-type="Numerical"' : 'data-type="MCQ"'}>
                        ${question.type === 'numerical' ? 'Numerical' : question.isMultiple ? 'MSQ' : 'MCQ'}
                    </span>
                </div>
                <span class="time-spent">⏱️ ${formatTime(question.timeSpent)}</span>
            </div>
            <div class="question-status">
                ${question.attempted ? 
                    (question.correct ? '✓ Correct' : '✗ Incorrect') : 
                    '— Unattempted'}
            </div>
            <div class="marks-info">
                <span>Max Marks: ${question.marks}</span>
                ${question.attempted ? `
                    <span class="marks-obtained ${question.marksObtained >= 0 ? 'positive' : 'negative'}">
                        ${question.marksObtained >= 0 ? '+' : ''}${question.marksObtained.toFixed(2)}
                    </span>
                ` : '<span class="marks-obtained">0.00</span>'}
            </div>
            ${question.attempted && !question.correct ? `
                <div class="answer-comparison">
                    <span class="user-answer">Your answer: ${formatAnswer(question.userAnswer)}</span>
                    <span class="correct-answer">Correct answer: ${formatAnswer(question.correctAnswer)}</span>
                </div>
            ` : ''}
        </div>
    `).join('');

    resultSection.innerHTML = `
        <div class="result-container">
            <h2>Test Results</h2>
            <div class="result-summary">
                <div class="summary-card total-questions">
                    <div class="value">${questionResults.length}</div>
                    <div class="label">Total Questions</div>
                </div>
                <div class="summary-card correct">
                    <div class="value">${correctAnswersCount}</div>
                    <div class="label">Correct Answers</div>
                </div>
                <div class="summary-card attempted">
                    <div class="value">${attemptedCount}</div>
                    <div class="label">Attempted Questions</div>
                </div>
                <div class="summary-card accuracy">
                    <div class="value">${accuracy}%</div>
                    <div class="label">Accuracy</div>
                </div>
                <div class="summary-card marks">
                    <div class="value">${totalMarks.toFixed(2)}</div>
                    <div class="label">Obtained Marks</div>
                </div>
                <div class="summary-card max-marks">
                    <div class="value">${totalMaxMarks}</div>
                    <div class="label">Maximum Marks</div>
                </div>
            </div>
            <div class="total-marks-info">
                <span>Total Marks Obtained: ${totalMarks.toFixed(2)}</span>
                <span>Out of Maximum Marks: ${totalMaxMarks}</span>
            </div>
            <div class="detailed-results">
                <h3>Test Analysis</h3>
                <div class="questions-grid">
                    ${questionsBreakdown}
                </div>
            </div>
            <div class="action-buttons">
                <button id="retryBtn" class="btn retry-btn">Retry Test</button>
                <button id="reviewBtn" class="btn review-btn">Review Answers</button>
            </div>
        </div>
    `;
    
    resultSection.style.display = 'block';
    
    setupReviewAnswers(questionResults);
    
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            resultSection.style.display = 'none';
            testStarted = false;
            
            resetMockTestButtons();

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = 'none';
                sidebarVisible = false;
            }
            
            initTest();
        });
    }
}

function formatAnswer(answer) {
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object') return JSON.stringify(answer);
    return answer;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? mins + 'm ' : ''}${secs}s`;
}

function startTimer(duration, displayElement) {
    if (!displayElement) return null;
    
    let timer = duration;
    
    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';
    
    const timerLabel = document.createElement('span');
    timerLabel.className = 'timer-label';
    timerLabel.textContent = 'Time Remaining:';
    
    const timeDisplay = document.createElement('span');
    timeDisplay.className = 'time-display';
    
    timerContainer.appendChild(timerLabel);
    timerContainer.appendChild(timeDisplay);
    displayElement.appendChild(timerContainer);

    const updateTimer = () => {
        const hours = Math.floor(timer / 3600);
        const minutes = Math.floor((timer % 3600) / 60);
        const seconds = timer % 60;
        
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        timeDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        
        if (timer <= 1200) {
            timeDisplay.style.color = '#e74c3c';
            if (timer <= 300) {
                timeDisplay.classList.add('blinking');
            }
        }
        
        if (--timer < 0) {
            clearInterval(intervalId);
            autoSubmitTest();
        }
    };
    
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    
    return intervalId;
}

function autoSubmitTest() {
    saveAnswer();
    calculateResult();
}

async function initTest() {
    if (testStarted) return;
    testStarted = true;
    
    resetMockTestButtons();
    
    questionStartTime = null;
    timeSpentPerQuestion = Array(TOTAL_QUESTIONS).fill(0);
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.display = 'none';
        sidebarVisible = false;
    }
    
    const { questions = [] } = await fetchQuestions();
    
    selectedQuestions = getRandomQuestions(questions);
    
    const totalSelectedMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    console.log(`Selected ${selectedQuestions.length} questions totaling ${totalSelectedMarks} marks`);
    
    currentQuestionIndex = 0;
    userAnswers = {};
    
    const timerElement = document.getElementById('timer');
    if (timerElement) timerElement.innerHTML = '';
    
    const instructionElement = document.getElementById('instruction-section');
    if (instructionElement) instructionElement.style.display = 'none';
    
    const resultElement = document.getElementById('result-section');
    if (resultElement) resultElement.style.display = 'none';
    
    const testElement = document.getElementById('test-section');
    if (testElement) testElement.style.display = 'block';
    
    if (!document.getElementById('progress-container')) {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.className = 'progress-bar';
        
        const marksCounter = document.createElement('div');
        marksCounter.id = 'marks-counter';
        marksCounter.className = 'marks-counter';
        marksCounter.textContent = 'Answered: 0/65';
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(marksCounter);
        
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.insertAdjacentElement('beforebegin', progressContainer);
        }
    }
    
    timerInterval = startTimer(3000, timerElement);
    displayCurrentQuestion();
}

// function setupReviewAnswers(questionResults) {


//     const reviewBtn = document.getElementById('reviewBtn');
//     if (!reviewBtn) return;

//     reviewBtn.addEventListener('click', function() {
//         // Scroll to the top of the page
//         window.scrollTo({ top: 0, behavior: 'smooth' });

//         const resultSummary = document.querySelector('.result-summary');
//         if (resultSummary) resultSummary.style.display = 'none';

//         const reviewContainer = document.createElement('div');
//         reviewContainer.className = 'review-container';
        
//         reviewContainer.innerHTML = `
//             <h3>Review All Answers</h3>
//             <div class="review-questions">
//                 ${questionResults.map(question => `
//                     <div class="review-question ${question.attempted ? (question.correct ? 'correct' : 'incorrect') : 'unattempted'}">
//                         <div class="review-question-header">
//                             <div>
//                                 <span class="question-number">Question ${question.number}</span>
//                                 <span class="question-type" ${question.isMultiple ? 'data-type="MSQ"' : question.type === 'numerical' ? 'data-type="Numerical"' : 'data-type="MCQ"'}>
//                                     ${question.type === 'numerical' ? 'Numerical' : question.isMultiple ? 'MSQ (Multiple Select)' : 'MCQ (Single Correct)'}
//                                 </span>
//                             </div>
//                             <span class="time-spent">⏱️ ${formatTime(question.timeSpent)}</span>
//                         </div>
//                         <div class="review-question-content">
//                             ${selectedQuestions[question.number - 1].image ? 
//                                 `<img src="${getImagePath(selectedQuestions[question.number - 1].image)}" class="review-question-image">` : ''}
//                             <p class="review-question-text">${selectedQuestions[question.number - 1].question}</p>
//                         </div>
//                         <div class="review-answer-section">
//                             <div class="marks-info">
//                                 <span>Max Marks: ${question.marks}</span>
//                                 <span class="marks-obtained ${question.marksObtained >= 0 ? 'positive' : 'negative'}">
//                                     ${question.marksObtained >= 0 ? '+' : ''}${question.marksObtained.toFixed(2)}
//                                 </span>
//                             </div>
//                             <div class="user-answer">
//                                 <strong>Your Answer:</strong>
//                                 ${question.attempted ? 
//                                     `<span class="${question.correct ? 'correct-answer' : 'incorrect-answer'}">${formatAnswer(question.userAnswer)}</span>` : 
//                                     '<span class="unattempted">Not attempted</span>'}
//                             </div>
//                             <div class="correct-answer">
//                                 <strong>Correct Answer:</strong>
//                                 <span>${formatAnswer(question.correctAnswer)}</span>
//                             </div>
//                             ${!question.correct && question.attempted ? `
//                                 <div class="explanation">
//                                     <strong>Explanation:</strong>
//                                     <p>${selectedQuestions[question.number - 1].explanation || 'No explanation available'}</p>
//                                 </div>
//                             ` : ''}
//                         </div>
//                     </div>
//                 `).join('')}
//             </div>
//             <button id="backToResults" class="btn back-btn">Back to Results</button>
//         `;

//         const detailedResults = document.querySelector('.detailed-results');
//         if (detailedResults) {
//             detailedResults.innerHTML = '';
//             detailedResults.appendChild(reviewContainer);
//         }

//         const backBtn = document.getElementById('backToResults');
//         if (backBtn) {
//             backBtn.addEventListener('click', function() {
//                 if (reviewContainer.parentNode) {
//                     reviewContainer.parentNode.removeChild(reviewContainer);
//                 }
                
//                 const resultSummary = document.querySelector('.result-summary');
//                 if (resultSummary) resultSummary.style.display = 'flex';
                
//                 const questionsGrid = document.querySelector('.questions-grid');
//                 if (questionsGrid) {
//                     questionsGrid.style.display = 'grid';
//                 }
//             });
//         }
//     });
// }

// Add styles

function setupReviewAnswers(questionResults) {
    const reviewBtn = document.getElementById('reviewBtn');
    if (!reviewBtn) return;

    reviewBtn.addEventListener('click', function() {
        const resultSummary = document.querySelector('.result-summary');
        if (resultSummary) resultSummary.style.display = 'none';

        const reviewContainer = document.createElement('div');
        reviewContainer.className = 'review-container';
        reviewContainer.id = 'review-container'; // Add ID for easier targeting
        
        reviewContainer.innerHTML = `
            <h3>Review All Answers</h3>
            <div class="review-questions">
                ${questionResults.map(question => `
                    <div class="review-question ${question.attempted ? (question.correct ? 'correct' : 'incorrect') : 'unattempted'}">
                        <div class="review-question-header">
                            <div>
                                <span class="question-number">Question ${question.number}</span>
                                <span class="question-type" ${question.isMultiple ? 'data-type="MSQ"' : question.type === 'numerical' ? 'data-type="Numerical"' : 'data-type="MCQ"'}>
                                    ${question.type === 'numerical' ? 'Numerical' : question.isMultiple ? 'MSQ (Multiple Select)' : 'MCQ (Single Correct)'}
                                </span>
                            </div>
                            <span class="time-spent">⏱️ ${formatTime(question.timeSpent)}</span>
                        </div>
                        <div class="review-question-content">
                            ${selectedQuestions[question.number - 1].image ? 
                                `<img src="${getImagePath(selectedQuestions[question.number - 1].image)}" class="review-question-image">` : ''}
                            <p class="review-question-text">${selectedQuestions[question.number - 1].question}</p>
                        </div>
                        <div class="review-answer-section">
                            <div class="marks-info">
                                <span>Max Marks: ${question.marks}</span>
                                <span class="marks-obtained ${question.marksObtained >= 0 ? 'positive' : 'negative'}">
                                    ${question.marksObtained >= 0 ? '+' : ''}${question.marksObtained.toFixed(2)}
                                </span>
                            </div>
                            <div class="user-answer">
                                <strong>Your Answer:</strong>
                                ${question.attempted ? 
                                    `<span class="${question.correct ? 'correct-answer' : 'incorrect-answer'}">${formatAnswer(question.userAnswer)}</span>` : 
                                    '<span class="unattempted">Not attempted</span>'}
                            </div>
                            <div class="correct-answer">
                                <strong>Correct Answer:</strong>
                                <span>${formatAnswer(question.correctAnswer)}</span>
                            </div>
                            ${!question.correct && question.attempted ? `
                                <div class="explanation">
                                    <strong>Explanation:</strong>
                                    <p>${selectedQuestions[question.number - 1].explanation || 'No explanation available'}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button id="backToResults" class="btn back-btn">Back to Results</button>
        `;

        const detailedResults = document.querySelector('.detailed-results');
        if (detailedResults) {
            detailedResults.innerHTML = '';
            detailedResults.appendChild(reviewContainer);
        }

        // Scroll to top after content is rendered
        setTimeout(() => {
            // Primary method: Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Fallback: Scroll to review container
            const reviewContainerElement = document.getElementById('review-container');
            if (reviewContainerElement) {
                reviewContainerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100); // 100ms delay to ensure DOM is updated

        const backBtn = document.getElementById('backToResults');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                if (reviewContainer.parentNode) {
                    reviewContainer.parentNode.removeChild(reviewContainer);
                }
                
                const resultSummary = document.querySelector('.result-summary');
                if (resultSummary) resultSummary.style.display = 'flex';
                
                const questionsGrid = document.querySelector('.questions-grid');
                if (questionsGrid) {
                    questionsGrid.style.display = 'grid';
                }
            });
        }
    });
}


const styleElement = document.createElement('style');
styleElement.innerHTML = `
    .question-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        align-items: flex-start;
        gap: 15px;
    }
    
    .question-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .question-type {
        font-size: 0.85rem;
        padding: 2px 8px;
        border-radius: 12px;
        display: inline-block;
        width: fit-content;
    }
    
    .question-type[data-type="MCQ"] {
        background-color: #e3f2fd;
        color: #1565c0;
    }
    
    .question-type[data-type="MSQ"] {
        background-color: #e8f5e9;
        color: #2e7d32;
    }
    
    .question-type[data-type="Numerical"] {
        background-color: #f3e5f5;
        color: #7b1fa2;
    }
    
    .marks-info {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }
    
    .question-marks {
        font-weight: bold;
        color: #2e7d32;
        background: #e8f5e9;
        padding: 3px 8px;
        border-radius: 4px;
    }
    
    .negative-marks {
        font-weight: bold;
        color: #c62828;
        background: #ffebee;
        padding: 3px 8px;
        border-radius: 4px;
    }
    
    .negative-marks[data-has-penalty="true"] {
        color: #c62828;
    }
    
    .result-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .summary-card {
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        min-width: 120px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .summary-card .value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .summary-card .label {
        font-size: 14px;
        color: #555;
    }
    
    .summary-card.total-questions {
        background: #e3f2fd;
        color: #0d47a1;
    }
    
    .summary-card.correct {
        background: #e8f5e9;
        color: #2e7d32;
    }
    
    .summary-card.attempted {
        background: #fff3e0;
        color: #e65100;
    }
    
    .summary-card.accuracy {
        background: #f3e5f5;
        color: #6a1b9a;
    }
    
    .summary-card.marks {
        background: #e0f7fa;
        color: #00838f;
    }
    
    .summary-card.max-marks {
        background: #f1f8e9;
        color: #558b2f;
    }
    
    .total-marks-info {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        padding: 15px;
        background: #f5f5f5;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
    }
    
    .detailed-results {
        margin-top: 30px;
    }
    
    .questions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .question-result {
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 6px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .question-result.correct {
        border-left: 4px solid #2e7d32;
    }
    
    .question-result.incorrect {
        border-left: 4px solid #c62828;
    }
    
    .question-result.unattempted {
        border-left: 4px solid #666;
    }
    
    .question-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    
    .question-status {
        font-weight: bold;
        margin: 8px 0;
    }
    
    .marks-obtained {
        font-weight: bold;
        margin-top: 5px;
    }
    
    .marks-obtained.positive {
        color: #2e7d32;
    }
    
    .marks-obtained.negative {
        color: #c62828;
    }
    
    .answer-comparison {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #ddd;
    }
    
    .user-answer {
        color: #c62828;
    }
    
    .correct-answer {
        color: #2e7d32;
    }
    
    .review-container {
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        margin-top: 20px;
    }
    
    .review-question {
        margin-bottom: 30px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .review-question-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .review-question-content {
        margin-bottom: 15px;
    }
    
    .review-question-image {
        max-width: 100%;
        height: auto;
        margin-bottom: 10px;
        border-radius: 4px;
    }
    
    .review-answer-section {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 6px;
    }
    
    .review-answer-section > div {
        margin-bottom: 10px;
    }
    
    .correct-answer span {
        color: #2e7d32;
        font-weight: 500;
    }
    
    .incorrect-answer {
        color: #c62828;
        font-weight: 500;
    }
    
    .unattempted {
        color: #666;
        font-style: italic;
    }
    
    .explanation {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #ccc;
    }
    
    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 30px;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .retry-btn {
        background: #4a6bff;
        color: white;
    }
    
    .retry-btn:hover {
        background: #3a5bef;
    }
    
    .review-btn {
        background: #2e7d32;
        color: white;
    }
    
    .review-btn:hover {
        background: #1b5e20;
    }
    
    .back-btn {
        margin-top: 20px;
        background: #4a6bff;
        color: white;
    }
    
    .back-btn:hover {
        background: #3a5bef;
    }
    
    .timer-container {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 6px;
        margin-bottom: 15px;
    }
    
    .time-display {
        font-weight: bold;
        font-size: 18px;
    }
    
    .time-display.blinking {
        animation: blink 1s linear infinite;
    }
    
    @keyframes blink {
        50% { opacity: 0.5; }
    }
    
    .progress-container {
        width: 100%;
        margin-bottom: 15px;
        background: #f5f5f5;
        border-radius: 4px;
        height: 20px;
        position: relative;
    }
    
    .progress-bar {
        height: 100%;
        border-radius: 4px;
        background: #4a6bff;
        width: 0%;
        transition: width 0.3s ease;
    }
    
    .marks-counter {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        color: #333;
    }
`;
document.head.appendChild(styleElement);

mockTestButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', () => {
            const check = document.getElementById("consentCheckbox");
            check.checked=false;
            const startTestBtn = document.getElementById('startTestBtn');
             startTestBtn.disabled=true;
               // Scroll to instructions
            const instructionSection = document.getElementById("instruction-section");
            if (instructionSection) {
                instructionSection.style.display = 'block';
                instructionSection.scrollIntoView({ behavior: 'smooth' });
            }
            mockTestButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            clearContent();
            if (instructionSection) instructionSection.style.display = 'block';
        });
    }
});

const startBtn = document.getElementById('startTestBtn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
            sidebarVisible = false;
        }
        initTest();
    });
}

const consentCheckbox = document.getElementById('consentCheckbox');
if (consentCheckbox) {
    consentCheckbox.addEventListener('change', (e) => {
        const startTestBtn = document.getElementById('startTestBtn');
        if (startTestBtn) {
            startTestBtn.disabled = !e.target.checked;
        }
    });
}

const dashboard = document.getElementById("dashboardBtn");
if (dashboard) {
    dashboard.addEventListener('click', function() {
        // Save any necessary state here
        // Then redirect
        window.location.href = '../../subjectmock/subject.html';
    });
}