// Select all tab buttons and content panels
const tabButtons = document.querySelectorAll('.workout-tab-button');
const tabContents = document.querySelectorAll('.workout-tab-content');

// Function to handle tab switching
function switchTab(event) {
    const targetTab = event.currentTarget.getAttribute('data-tab');

    // Remove 'active' class from all buttons and contents
    tabButtons.forEach(button => button.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add 'active' class to the clicked button and corresponding content
    event.currentTarget.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
}

// Add event listeners to each tab button
tabButtons.forEach(button => {
    button.addEventListener('click', switchTab);
});
