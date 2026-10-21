// Portal page: birth-details form.
// Posts to the MailerLite form set in data-ml-action.
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

// Portal page: thank-you message after Stripe checkout (redirects to ?paid=1#thank-you).
(function () {
  var box = document.getElementById("thank-you");
  if (!box) return;
  var paid = new URLSearchParams(window.location.search).get("paid");
  if (paid !== "1") return;
  box.hidden = false;
  requestAnimationFrame(function () { box.scrollIntoView({ block: "start" }); });
})();
