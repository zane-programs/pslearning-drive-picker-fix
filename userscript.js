// ==UserScript==
// @name         Google Drive Picker Fix
// @namespace    https://zanestjohn.com/
// @version      0.4.2
// @description  Fix Google Drive picker on PowerSchool Learning
// @author       Zane St. John
// @match        https://*.learning.powerschool.com/*
// @icon         https://www.google.com/s2/favicons?domain=my.learning.powerschool.com
// @grant        none
// ==/UserScript==

(function (window, $) {
  "use strict";

  // url for fix script
  const FIX_SCRIPT_URL =
    "https://cdn.jsdelivr.net/gh/zane-programs/pslearning-drive-picker-fix@5ecdbb6efe6cb0033734ece4e71f573edeaf1ee0/fix-core.min.js";

  // will hold a reference to the newly created
  // google drive upload button
  let NEW_DRIVE_BUTTON;

  function showLoadingSpinner(button) {
    const icon = button.querySelector("i");
    if (icon) {
      // create spinner
      let spinner = document.createElement("img");
      spinner.src = "/images/loading.gif";
      spinner.alt = "Loading...";
      spinner.style.position = "relative";
      spinner.style.top = "2px";
      spinner.style.marginRight = "7px";

      // replace icon with spinner
      icon.parentNode.replaceChild(spinner, icon);
    }
  }

  function hideLoadingSpinner(button) {
    const spinner = button.querySelector("img");
    if (spinner) {
      // create icon
      const icon = document.createElement("i");

      // replace spinner with icon
      spinner.parentNode.replaceChild(icon, spinner);
    }
  }

  // thanks to https://stackoverflow.com/a/29754070
  function waitForElementToDisplay(
    selector,
    callback,
    checkFrequencyInMs,
    timeoutInMs
  ) {
    var startTimeInMs = Date.now();
    (function loopSearch() {
      if (document.querySelector(selector) != null) {
        callback();
        return;
      } else {
        setTimeout(function () {
          if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) return;
          loopSearch();
        }, checkFrequencyInMs);
      }
    })();
  }

  function initPickerFix() {
    // add picker button when on hand-in page
    $(document).on("tb:shown", () => {
      if (
        document
          .querySelector("#TB_ajaxContent")
          .getAttribute("tburl")
          .indexOf("/dropbox/write") !== -1
      ) {
        // we're on the hand-in page, so create our drive upload button
        let driveButton = document.createElement("button"); // create google drive button
        driveButton.type = "button"; // this is just a regular button, not a form submit
        driveButton.title = `Workaround v${window._DRIVE_FIX_VERSION}`;
        driveButton.classList.add("sbutton", "bdoc"); // sbutton appearance with docs icon
        driveButton.addEventListener("click", () => {
          showLoadingSpinner(driveButton);
          openPickerWindow(
            // write page url
            document.querySelector("#TB_ajaxContent").getAttribute("tburl")
          ).catch((error) => {
            hideLoadingSpinner(driveButton); // stop loading symbol on error
            showErrorDialog(error); // user error dialog
          });
        }); // open drive picker on click
        driveButton.innerHTML = "<i></i>Attach From Google Drive"; // add content to button

        // save a reference to the new button for use elsewhere in this script
        NEW_DRIVE_BUTTON = driveButton;

        // wait for google drive button to be arranged
        // (there's probably an event for me to listen
        // to somewhere, but for now, this will do)
        waitForElementToDisplay(
          "#other_upload_buttons",
          () => {
            // replace old button with our new one
            const originalButton = document.querySelector(
              "#google_drive_attach_button"
            );
            originalButton.parentNode.replaceChild(driveButton, originalButton);
          },
          200,
          10000
        );
      }
    });
  }

  function loadFixScript() {
    const script = document.createElement("script");
    script.src = FIX_SCRIPT_URL;
    // add fixed button on load
    script.onload = initPickerFix;
    // add script to head
    document.head.appendChild(script);
  }

  // load fix
  loadFixScript();
})(window, jQuery);
