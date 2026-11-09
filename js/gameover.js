/* gameover - points*/

document.addEventListener('DOMContentLoaded', function () {
    const finalPoints = localStorage.getItem('finalPoints') || 0;
    document.getElementById('points-display').textContent = `Jūsu punkti: ${finalPoints}`;
});
