// Portal page: birth-details form.
// TODO: once a MailerLite form exists for this offer, set data-ml-action on the form to
// https://assets.mailerlite.com/jsonp/994210/forms/<FORM_ID>/subscribe
// Until then, submissions are blocked so nothing is faked.
(function () {
  var form = document.querySelector("[data-portal-form]");
  if (!form) return;
  var status = form.querySelector(".p-form-status");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var action = form.getAttribute("data-ml-action");
    if (!action) {
      status.textContent = "This form isn't connected yet. Please email your birth details to themagicalstoryofus@gmail.com.";
      return;
    }
    status.textContent = "Sending...";
    fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
      .then(function () {
        form.reset();
        status.textContent = "Thank you, your birth details are on their way to me. ✦";
      })
      .catch(function () {
        status.textContent = "Something went wrong. Please email your birth details to themagicalstoryofus@gmail.com.";
      });
  });
})();
