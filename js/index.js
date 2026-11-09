/* intex - toggle */

const aboutLink = document.getElementById('about-link');
const homeLink = document.getElementById('home-link');
const aboutSection = document.getElementById('about');

aboutLink.addEventListener('click', (event) => {
    event.preventDefault();
    aboutSection.classList.add('active');
});

homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    aboutSection.classList.remove('active');
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        aboutSection.classList.remove('active');
    }
});
