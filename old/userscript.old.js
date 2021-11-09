// ==UserScript==
// @name         Google Drive Picker Fix
// @namespace    https://zanestjohn.com/
// @version      0.3.2
// @description  Fix Google Drive picker on PowerSchool Learning
// @author       Zane St. John
// @match        https://*.learning.powerschool.com/*
// @icon         https://www.google.com/s2/favicons?domain=my.learning.powerschool.com
// @grant        none
// ==/UserScript==

(function (window, $) {
  "use strict";

  // will hold a reference to the newly created
  // google drive upload button
  var NEW_DRIVE_BUTTON;
  // will hold a reference to the check interval
  // that stops loading visual when the picker
  // window is closed
  var PICKER_WINDOW_CLOSE_CHECK_INTERVAL;

  window.addEventListener("message", function (message) {
    if (message.data.drivePickerData) {
      // hide loading spinner
      hideLoadingSpinner(NEW_DRIVE_BUTTON);
      // clear picker window check interval
      clearInterval(PICKER_WINDOW_CLOSE_CHECK_INTERVAL);

      // data from drive picker
      var data = message.data.drivePickerData;
      // if it wasn't canceled by user
      if (!(data.drivePickerData && data.drivePickerData.canceled)) {
        if (data.action == google.picker.Action.PICKED) {
          // show google drive table
          Element.show("tb_google_drive_stub");

          var docs = $("#google_drive_files_list").data(
            "google-drive-document-data"
          );
          var new_docs = [];

          if (docs === undefined) docs = [];

          var document_ids;
          data.docs.each(function (doc) {
            document_ids = docs.map(function (value) {
              return value.id;
            });

            if ($.inArray(doc.id, document_ids) == -1) {
              new_docs.push(doc);
              docs.push(doc);
            }
          });

          present_selected_files(new_docs);
          $("#google_drive_files_list").data(
            "google-drive-document-data",
            docs
          );
        }
      }
    }
  });

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

  function showErrorDialog(error) {
    MD_alert(
      `<h1>Error</h1><p>${
        error && error.message
          ? error.message
          : error || "Unknown error occurred"
      }</p>`
    );
  }

  async function openPickerWindow() {
    // check for thickbox
    const thickboxContent = document.querySelector("#TB_ajaxContent");
    if (!thickboxContent) {
      throw new Error("Hand-in page not present");
    }

    // attempt to get oauth token
    const token = await getOauthToken(thickboxContent.getAttribute("tburl"));

    // create window
    let pickerWin = window.open(
      "https://windward.learning.powerschool.com/images/picker",
      null,
      "width=800,height=600"
    );
    pickerWin.addEventListener("load", function () {
      pickerWin.document.documentElement.innerHTML = generatePickerHtml(token);
      pickerWin.document.title = "Attach from Google Drive";
    });

    // stop loading on close
    PICKER_WINDOW_CLOSE_CHECK_INTERVAL = setInterval(() => {
      if (pickerWin.closed) {
        hideLoadingSpinner(NEW_DRIVE_BUTTON);
        clearInterval(PICKER_WINDOW_CLOSE_CHECK_INTERVAL);
      }
    }, 500);
  }

  async function getOauthToken(url) {
    try {
      const req = await fetch(url, {
        method: "GET",
        headers: new Headers({
          "X-Requested-With": "XMLHttpRequest",
        }),
      });
      const resp = await req.text();
      const lines = resp.split("\n");

      const tokenLine = lines.find(function (line) {
        return line.indexOf("var oauthToken =") !== -1;
      });

      if (tokenLine) {
        return tokenLine.split(" = ")[1].trim().slice(1, -2);
      }
    } catch (error) {
      return showErrorDialog(error);
    }
  }

  function generatePickerHtml(oauthToken) {
    return `<style>body{overflow:hidden}.picker-dialog{width:100%!important;height:100%!important;top:0!important;left:0!important}.picker-dialog-content{width:100%!important;height:100%!important}</style><div style="display: none;" id="pickerScript">var googleapis=document.createElement("script");googleapis.src="https://apis.google.com/js/api.js?onload=loadPicker";document.head.appendChild(googleapis);window.developerKey="AIzaSyAIp-SKWaTDGWQxUAMmZw6rU4JYB5NGXE8";window.pickerApiLoaded=!1;window.oauthToken="${oauthToken}";window.loadPicker=function(){gapi.load("picker",{callback:onPickerApiLoad})};
window.onPickerApiLoad=function(){pickerApiLoaded=!0;createPicker()};window.createPicker=function(){pickerApiLoaded&&oauthToken&&((new google.picker.View(google.picker.ViewId.DOCS)).setMimeTypes("image/png,image/jpeg,image/jpg"),(new google.picker.PickerBuilder).enableFeature(google.picker.Feature.NAV_HIDDEN).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(oauthToken).setDeveloperKey(window.developerKey).addView((new google.picker.DocsView).setIncludeFolders(!1).setMode(google.picker.DocsViewMode.LIST)).addView((new google.picker.DocsUploadView).setIncludeFolders(!0)).setCallback(pickerCallback).enableFeature(google.picker.Feature.SUPPORT_DRIVES).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).build().setVisible(!0))};
window.pickerCallback=function(a){a.action==google.picker.Action.PICKED?(window.opener.postMessage({drivePickerData:a},window.location.protocol+"//"+window.location.host),window.close()):a.action==google.picker.Action.CANCEL&&(window.opener.postMessage({drivePickerData:{canceled:true}},window.location.protocol+"//"+window.location.host),window.close())};</div><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" onload="eval(document.getElementById('pickerScript').innerText);document.getElementById('pickerScript').remove();this.remove();"/>`;
  }

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
      driveButton.classList.add("sbutton", "bdoc"); // sbutton appearance with docs icon
      driveButton.addEventListener("click", () => {
        showLoadingSpinner(driveButton);
        openPickerWindow().catch((error) => {
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
})(window, jQuery);
