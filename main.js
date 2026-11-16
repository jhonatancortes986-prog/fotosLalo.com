document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.querySelector("#token");
  if (tokenInput) {
    tokenInput.addEventListener("input", () => {
      tokenInput.setCustomValidity("");
    });
  }
});