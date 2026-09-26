(function () {
  "use strict";

  var storageKey = "chosen-docs-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  var savedTheme;
  var followsSystem = true;

  try {
    savedTheme = window.localStorage.getItem(storageKey);
  } catch (error) {
    savedTheme = null;
  }

  if (savedTheme === "dark" || savedTheme === "light") {
    root.setAttribute("data-theme", savedTheme);
    followsSystem = false;
  } else {
    root.setAttribute("data-theme", media.matches ? "dark" : "light");
  }

  function activeTheme() {
    return root.getAttribute("data-theme") || (media.matches ? "dark" : "light");
  }

  function updateThemeColor(theme) {
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#15181d" : "#111827");
  }

  function updateButton(button) {
    var nextTheme = activeTheme() === "dark" ? "light" : "dark";
    button.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
    button.setAttribute("aria-label", "Use " + nextTheme + " color scheme");
    updateThemeColor(activeTheme());
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    updateButton(button);
    button.addEventListener("click", function () {
      var theme = activeTheme() === "dark" ? "light" : "dark";
      followsSystem = false;
      root.setAttribute("data-theme", theme);
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (error) {
        // The selected theme still applies for this page when storage is unavailable.
      }
      updateButton(button);
    });

    if (media.addEventListener) {
      media.addEventListener("change", function () {
        if (!followsSystem) return;
        root.setAttribute("data-theme", media.matches ? "dark" : "light");
        updateButton(button);
      });
    }
  });
})();
