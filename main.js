// Define global variables
var header = document.getElementById('header');
var images = document.getElementsByClassName('family-image');
var modal = document.getElementById('modal');
var modalImage = document.getElementById('modal-image');
var closeButton = document.getElementById('close');
var emailInput = document.getElementById('email-input');
var submitButton = document.getElementById('submit');
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


// Validate email address when Submit button is clicked to join mailing list
submitButton.onclick = validateEmail;

// Validate email address when Enter key is clicked in email input
emailInput.addEventListener('keyup', function(e) {
  if (e.keyCode == 13 && !submitButton.disabled) {
    e.preventDefault();
    return validateEmail();
  }
}, false);

function validateEmail() {
  // Disable Submit button and email input
  submitButton.disabled = true;
  emailInput.disabled = true;

  // Set cursor style to pending
  document.body.style.cursor = 'wait';

  // Hide success message but keep it displayed to provide space for message
  document.getElementById('success').style.display = 'block';
  document.getElementById('success').style.visibility = 'hidden';

  // Hide other messages
  document.getElementById('invalid-error').style.display = 'none';
  document.getElementById('invalid-error').style.visibility = 'hidden';
  document.getElementById('server-error').style.display = 'none';
  document.getElementById('server-error').style.visibility = 'hidden';
  document.getElementById('already').style.display = 'none';
  document.getElementById('already').style.visibility = 'hidden';

  // Remove all whitespace from email input
  var email = emailInput.value.replace(/\s/g, '');

  // Display error message if email is invalid format
  var format = new RegExp(['^(([^<>()\\[\\]\\.,;:\\s@\\"]+(\\.',
    '[^<>()\\[\\]\\.,;:\\s@\\"]+)*)|(\\".+\\"))@(([^<>()[\\]\\.,;:\\s@\\"]+\\',
    '.)+[^<>()[\\]\\.,;:\\s@\\"]{2,})$'].join(''), 'i')

  if (!format.test(email)) {
    // Hide success message
    document.getElementById('success').style.display = 'none';

    // Display error message
    document.getElementById('invalid-error').style.visibility = 'visible';
    document.getElementById('invalid-error').style.display = 'block';

    // Enable Submit button and email input
    submitButton.disabled = false;
    emailInput.disabled = false;

    // Reset cursor style
    document.body.style.cursor = '';

    return;
  }

  // Otherwise, submit email to server
  return submitEmail(email);
}

function submitEmail(email) {
  var data = JSON.stringify({
    'email': email
  });

  return fetch('https://nobugs-210202.appspot.com/api/email', {
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    body: data
  })

    // If server errors out, display server error message
    .catch(function(error) {
      document.getElementById('success').style.display = 'none';

      document.getElementById('server-error').style.visibility = 'visible';
      document.getElementById('server-error').style.display = 'block';

      // Enable Submit button and email input
      submitButton.disabled = false;
      emailInput.disabled = false;

      // Reset cursor style
      document.body.style.cursor = '';
    })

    .then(function(response) {
      if (response) {
        // Display error message that email address is invalid
        if (response.status == 400) {
          document.getElementById('success').style.display = 'none';

          document.getElementById('invalid-error').style.visibility = 'visible';
          document.getElementById('invalid-error').style.display = 'block';
        }

        // Display message that email address is already on mailing list
        else if (response.status == 409) {
          document.getElementById('success').style.display = 'none';

          document.getElementById('already').style.visibility = 'visible';
          document.getElementById('already').style.display = 'block';
        }

        // If request is successful, display success message
        else if (response.status == 201) {
          document.getElementById('success').style.visibility = 'visible';

          // Clear email input
          emailInput.value = '';
        }

        // Otherwise, display server error message
        else {
          document.getElementById('success').style.display = 'none';

          document.getElementById('server-error').style.visibility = 'visible';
          document.getElementById('server-error').style.display = 'block';
        }

        // Enable Submit button and email input
        submitButton.disabled = false;
        emailInput.disabled = false;

        // Reset cursor style
        document.body.style.cursor = '';
      }
    });
}
