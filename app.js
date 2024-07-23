// Language in header Section here

document.addEventListener('DOMContentLoaded', function () {
    const languageBtn = document.querySelector('.language-btn');
    const languageDropdown = document.querySelector('.language-dropdown');

    languageBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        languageDropdown.style.display = languageDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function () {
        languageDropdown.style.display = 'none';
    });

    languageDropdown.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
            const selectedLang = e.target.getAttribute('data-lang');
            languageBtn.textContent = e.target.textContent + ' ▼';
            console.log('Selected language:', selectedLang);
        }
    });
});

// table by gender and age and bodyweight toggles here

document.addEventListener('DOMContentLoaded', function () {
    const imageTabs = document.querySelectorAll('.image-group ul li');
    const categoryTabs = document.querySelectorAll('.category-group ul li');
    function updateTabContent() {
        const activeImageTab = document.querySelector('.image-group ul li.is-active').getAttribute('data-tab');
        const activeCategoryTab = document.querySelector('.category-group ul li.is-active').getAttribute('data-tab');
        const allTabContents = document.querySelectorAll('.tab');
        allTabContents.forEach(tabContent => {
            if (tabContent.id === `${activeImageTab}-${activeCategoryTab}`) {
                tabContent.classList.add('is-active');
            } else {
                tabContent.classList.remove('is-active');
            }
        });
    }
    imageTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabsInSameGroup = this.closest('.image-group').querySelectorAll('ul li');
            tabsInSameGroup.forEach(t => t.classList.remove('is-active'));
            this.classList.add('is-active');
            updateTabContent();
        });
    });
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabsInSameGroup = this.closest('.category-group').querySelectorAll('ul li');
            tabsInSameGroup.forEach(t => t.classList.remove('is-active'));
            this.classList.add('is-active');
            updateTabContent();
        });
    });
    document.querySelector('.image-group ul li[data-tab="Male"]').classList.add('is-active');
    document.querySelector('.category-group ul li[data-tab="By Bodyweight"]').classList.add('is-active');
    updateTabContent();
});

// show and hide table here
function toggleMenu() {
    var menu = document.getElementById("menu");
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
    }
}

// search exercise card here
document.getElementById('search-bar').addEventListener('input', filterExercises);

function filterExercises() {
    const input = document.getElementById('search-bar').value.toLowerCase();
    const cards = document.getElementsByClassName('exercise-card');
    const names = document.getElementsByClassName('name');

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const name = names[i].textContent.toLowerCase();

        if (name.includes(input)) {
            card.parentElement.style.display = '';
        } else {
            card.parentElement.style.display = 'none';
        }
    }
}
