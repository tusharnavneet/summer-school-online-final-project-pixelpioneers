   // Subject data (would normally come from a database or API)
   const subjectData = {
    "engineering-math": {
        title: "Engineering Mathematics",
        topics: [
            "Linear Algebra",
            "Calculus",
            "Differential Equations",
            "Complex Variables",
            "Probability and Statistics",
            "Numerical Methods",
            "Graph Theory"
        ]
    },
    "digital-logic": {
        title: "Digital Logic",
        topics: [
            "Boolean Algebra",
            "Logic Gates",
            "Combinational Circuits",
            "Sequential Circuits",
            "Number Systems",
            "K-Maps",
            "Flip-Flops",
            "Counters"
        ]
    },
    "coa": {
        title: "Computer Organization and Architecture",
        topics: [
            "Instruction Set Architecture",
            "Processor Organization",
            "Memory Hierarchy",
            "I/O Systems",
            "Pipelining",
            "Cache Memory",
            "Virtual Memory"
        ]
    },
    "ds-algo": {
        title: "C Programming and Data Structures",
        topics: [
            "Arrays",
            "Stacks and Queues",
            "Linked Lists",
            "Trees",
            "Graphs",
            "Hashing",
            "Sorting Algorithms",
            "Searching Algorithms"
        ]
    },
    "algorithms": {
        title: "Algorithms",
        topics: [
            "Divide and Conquer",
            "Greedy Algorithms",
            "Dynamic Programming",
            "Backtracking",
            "Graph Algorithms",
            "Complexity Analysis",
            "NP-Completeness"
        ]
    },
    "toc": {
        title: "Theory of Computation",
        topics: [
            "Regular Languages",
            "Context-Free Grammars",
            "Pushdown Automata",
            "Turing Machines",
            "Computability",
            "Complexity Classes",
            "P vs NP Problem"
        ]
    },
    "compiler": {
        title: "Compiler Design",
        topics: [
            "Lexical Analysis",
            "Syntax Analysis",
            "Semantic Analysis",
            "Intermediate Code Generation",
            "Code Optimization",
            "Code Generation",
            "Symbol Table Management"
        ]
    },
    "os": {
        title: "Operating System",
        topics: [
            "Process Management",
            "Memory Management",
            "File Systems",
            "I/O Systems",
            "Scheduling Algorithms",
            "Deadlocks",
            "Virtual Memory"
        ]
    },
    "dbms": {
        title: "Database Management System",
        topics: [
            "ER Model",
            "Relational Model",
            "SQL",
            "Normalization",
            "Transactions",
            "Concurrency Control",
            "Indexing",
            "Query Processing"
        ]
    },
    "networks": {
        title: "Computer Networks",
        topics: [
            "Network Models (OSI, TCP/IP)",
            "Physical Layer",
            "Data Link Layer",
            "Network Layer",
            "Transport Layer",
            "Application Layer",
            "Routing Algorithms",
            "Network Security"
        ]
    },
    "discrete-math": {
        title: "Discrete Maths",
        topics: [
            "Propositional Logic",
            "Predicate Logic",
            "Set Theory",
            "Relations",
            "Functions",
            "Combinatorics",
            "Graph Theory",
            "Algebraic Structures"
        ]
    },
    "aptitude": {
        title: "General Aptitude",
        topics: [
            "Verbal Ability",
            "Numerical Ability",
            "Logical Reasoning",
            "Data Interpretation",
            "Quantitative Comparisons",
            "English Grammar",
            "Reading Comprehension"
        ]
    }
};

// DOM Elements
const syllabusItems = document.querySelectorAll('.syllabus-container li');
const modal = document.getElementById('subjectModal');
const modalTitle = document.getElementById('subjectTitle');
const modalNumber = document.getElementById('subjectNumber');
const topicsList = document.getElementById('topicsList');
const closeModal = document.querySelector('.close-modal');

// Add click event to each syllabus item
syllabusItems.forEach(item => {
    item.addEventListener('click', () => {
        const subjectId = item.getAttribute('data-subject');
        const subject = subjectData[subjectId];
        const itemNumber = item.textContent.match(/\d+/)?.[0] || '';

        // Update modal content
        modalTitle.textContent = subject.title;
        modalNumber.textContent = itemNumber;
        
        // Clear and rebuild topics list
        topicsList.innerHTML = '';
        subject.topics.forEach(topic => {
            const li = document.createElement('li');
            li.textContent = topic;
            topicsList.appendChild(li);
        });

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
});

// Close modal when X is clicked
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside content
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
const dashboard = document.getElementById("dashboardBtn");
if (dashboard) {
    dashboard.addEventListener('click', function() {
        // Save any necessary state here
        // Then redirect
        window.location.href = '../dashBoard/dashboard.html';
    });
}