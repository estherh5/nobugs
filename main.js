// Define global variables
var header = document.getElementById('header');
var images = document.getElementsByClassName('family-image');
var modal = document.getElementById('modal');
var modalImage = document.getElementById('modal-image');
var closeButton = document.getElementById('close');
var signupForm = document.getElementById('signup');
var emailInput = document.getElementById('email-input');
var submitButton = document.getElementById('submit');
var retryButton = document.getElementById('retry');
var messages = ['invalid-error', 'server-error', 'already', 'success'];
var supportsPassive = false; // If browser supports passive event listeners
var lastThumbnail = null; // Thumbnail that opened the modal, to return focus to


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


// Toggle shrink style on header when user scrolls (the homepage has no header)
if (header) {
  window.addEventListener('scroll', function() {
    header.classList.toggle('shrink', window.pageYOffset > 100);
  }, supportsPassive ? { passive: true } : false);
}


// Display zoomed-in image when user clicks or presses Enter/Space on a thumbnail
function openPhoto(thumbnail) {
  lastThumbnail = thumbnail;
  modalImage.classList.remove('horizontal-zoomed');
  modalImage.classList.remove('vertical-zoomed');
  modalImage.classList.add(thumbnail.dataset.orientation + '-zoomed');
  modalImage.src = thumbnail.src;
  modalImage.alt = thumbnail.alt;
  modal.showModal();
  closeButton.focus();
}

for (var i = 0; i < images.length; i++) {
  images[i].setAttribute('tabindex', '0');
  images[i].setAttribute('role', 'button');
  images[i].setAttribute('aria-label', 'Enlarge photo: ' + images[i].alt);
  images[i].addEventListener('click', function() {
    openPhoto(this);
  }, false);
  images[i].addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPhoto(this);
    }
  }, false);
}


/* Hide zoomed-in image when user clicks outside of image in modal or clicks
close button; the native dialog closes itself on Escape and traps focus */
if (modal) {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.close();
    }
  }, false);

  closeButton.addEventListener('click', function() {
    modal.close();
  }, false);

  modal.addEventListener('close', function() {
    if (lastThumbnail) {
      lastThumbnail.focus();
    }
  }, false);
}


// Show one sign-up message (or none) and hide the rest
function showMessage(id) {
  for (var i = 0; i < messages.length; i++) {
    document.getElementById(messages[i]).classList.toggle('shown', messages[i] === id);
  }
}

// Busy state on the button itself while the request is in flight
function setBusy(busy) {
  submitButton.disabled = busy;
  emailInput.disabled = busy;
  submitButton.setAttribute('aria-busy', busy ? 'true' : 'false');
  submitButton.classList.toggle('busy', busy);
  submitButton.textContent = busy ? 'Joining…' : 'Join Our Mailing List';
}


// Validate email address when the form is submitted (button click or Enter key)
signupForm.addEventListener('submit', function(e) {
  e.preventDefault();
  validateEmail();
}, false);

retryButton.addEventListener('click', validateEmail, false);

function validateEmail() {
  // Remove all whitespace from email input
  var email = emailInput.value.replace(/\s/g, '');

  // Display error message if email is invalid format
  var format = new RegExp(['^(([^<>()\\[\\]\\.,;:\\s@\\"]+(\\.',
    '[^<>()\\[\\]\\.,;:\\s@\\"]+)*)|(\\".+\\"))@(([^<>()[\\]\\.,;:\\s@\\"]+\\',
    '.)+[^<>()[\\]\\.,;:\\s@\\"]{2,})$'].join(''), 'i')

  if (!format.test(email)) {
    showMessage('invalid-error');
    emailInput.setAttribute('aria-invalid', 'true');
    emailInput.focus();
    return;
  }

  emailInput.removeAttribute('aria-invalid');
  showMessage(null);
  return submitEmail(email);
}

function submitEmail(email) {
  setBusy(true);

  // Give up after 15 seconds so the button never stays busy forever
  var controller = window.AbortController ? new AbortController() : null;
  var timer = controller ? setTimeout(function() { controller.abort(); }, 15000) : null;

  return fetch('https://nobugs-210202.appspot.com/api/email', {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: JSON.stringify({ 'email': email }),
    signal: controller ? controller.signal : undefined
  })

    .then(function(response) {
      // Email address rejected by the server as invalid
      if (response.status == 400) {
        showMessage('invalid-error');
      }

      // Email address is already on mailing list
      else if (response.status == 409) {
        showMessage('already');
      }

      // Request is successful: confirm and clear the input
      else if (response.status == 201) {
        showMessage('success');
        emailInput.value = '';
      }

      // Anything else is a server error
      else {
        showMessage('server-error');
      }
    })

    // Network failure or timeout
    .catch(function() {
      showMessage('server-error');
    })

    .then(function() {
      clearTimeout(timer);
      setBusy(false);
    });
}
