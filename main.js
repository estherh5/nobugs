// Define variables
var header = document.getElementById('header');
var footer = document.getElementById('footer');
var images = document.getElementsByClassName('family-image');
var modals = document.getElementsByClassName('modal');
var zoomed = document.getElementsByClassName('zoomed');
var closeButtons = document.getElementsByClassName('close');

// Define events
window.addEventListener('scroll', function () {
  if (window.pageYOffset > 100) {
    header.classList.add('shrink');
    footer.classList.add('shrink');
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
    footer.classList.remove('shrink');
  }
})

for (var i = 0; i < images.length; i++) {
  images[i].addEventListener('click', modalDisplay, false);
}

for (var i = 0; i < modals.length; i++) {
  modals[i].addEventListener('click', modalHide, false);
}

for (var i = 0; i < closeButtons.length; i++) {
  closeButtons[i].addEventListener('click', modalHide, false);
}

// Define functions
function modalDisplay() {
  modals[this.dataset.number].classList.add('modal-display');
}

function modalHide() {
  if (this.classList.contains('modal-display')) {
    this.classList.remove('modal-display');
  } else if (this.classList.contains('close')) {
    this.parentNode.classList.remove('modal-display');
  }
}
