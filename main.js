// Define global variables
var header = document.getElementById('header');
var images = document.getElementsByClassName('family-image');
var modal = document.getElementById('modal');
var modalImage = document.getElementById('modal-image');
var closeButton = document.getElementById('close');
var supportsPassive = false; // If browser supports passive event listeners


// Assess if browser supports passive event listeners for faster processing
try {
  var options = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
      return;
    }
  });
  window.addEventListener('test', null, options);
} catch (e) {}


// Toggle shrink style on header when user scrolls
window.addEventListener('scroll', function() {
  if (window.pageYOffset > 100) {
    header.classList.add('shrink');
    return;
  } else if (header.classList.contains('shrink')) {
    header.classList.remove('shrink');
    return;
  }
  return;
}, supportsPassive ? { passive: true } : false);


// Display zoomed-in image when user clicks thumbnail
for (var i = 0; i < images.length; i++) {
  images[i].addEventListener('click', function() {
    modalImage.classList.remove('horizontal-zoomed');
    modalImage.classList.remove('vertical-zoomed');
    modalImage.classList.add(this.dataset.orientation + '-zoomed');
    modalImage.src = this.src;
    modalImage.title = this.title;
    modalImage.alt = this.alt;
    modal.classList.add('modal-display');
    return;
  }, false);
}


/* Hide zoomed-in image when user clicks outside of image in modal,
clicks close button, or clicks escape key when modal is displayed */
modal.onclick = function(e) {
  if (e.target == modal) {
    modal.classList.remove('modal-display');
    return;
  }
  return;
}

closeButton.onclick = function() {
  modal.classList.remove('modal-display');
  return;
}

window.onkeydown = function(e) {
  if (modal.classList.contains('modal-display') && e.keyCode == 27) {
    e.preventDefault();
    modal.classList.remove('modal-display');
    return;
  }
  return;
}
