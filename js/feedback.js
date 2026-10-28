// Feedback page: posts the reflections form to the MailerLite form set in data-ml-action.
// Every named input is sent via FormData, so answers land on the subscriber's custom fields
// (came_in_with, what_shifted, support_needed, extra_comments, quote_permission) and the subscriber joins the "Retrograde Revelations Feedback" group.
(function () {
  var form = document.querySelector("[data-feedback-form]");
  if (!form) return;
  var status = form.querySelector(".p-form-status");
  var thanks = document.getElementById("fb-thanks");
  var fallback = "Something went wrong. Please reply to my email with your reflections, or write to themagicalstoryofus@gmail.com.";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var action = form.getAttribute("data-ml-action");
    if (!action) { status.textContent = fallback; return; }
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = "Sending...";
    fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
      .then(function () {
        form.reset();
        form.hidden = true;
        if (thanks) {
          thanks.hidden = false;
          thanks.scrollIntoView({ block: "center" });
          thanks.focus({ preventScroll: true });
        }
      })
      .catch(function () {
        btn.disabled = false;
        status.textContent = fallback;
      });
  });
})();
