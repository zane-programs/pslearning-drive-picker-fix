/**
 * PowerSchool Learning Google Drive Fix
 *
 * @file A workaround for Google Drive submissions in PowerSchool Learning
 * @author Zane St. John <zstjohn22@windwardschool.org>
 * @version 0.4.2
 */

(function (window, $) {
  "use strict";

  window._DRIVE_FIX_VERSION = "0.4.2"; // Version number

  /**
   * Opens the Google Drive picker for a given hand-in/write page
   *
   * @param {string} writePageUrl - The path of the /dropbox/write page
   */
  async function openPickerWindow(writePageUrl) {
    try {
      // Check for ThickBox
      const thickboxContent = document.querySelector("#TB_ajaxContent");
      if (!thickboxContent) {
        throw new Error("Hand-in page not present");
      }

      // Attempt to get OAuth token
      const token = await getOauthToken(writePageUrl);

      // Create picker window
      let pickerWin = window.open(
        "https://windward.learning.powerschool.com/images/picker",
        null,
        "width=800,height=600"
      );

      // Add HTML and title on window load
      pickerWin.addEventListener("load", function () {
        pickerWin.document.documentElement.innerHTML =
          generatePickerHtml(token);
        pickerWin.document.title = "Attach from Google Drive";
      });
    } catch (error) {
      // Show modal dialog on error
      showErrorDialog(error);
    }
  }

  /**
   * Gets Google OAuth token from a given hand-in/write page
   *
   * @param {string} url - The path of the /dropbox/write page
   * @returns {Promise<string | undefined>} The OAuth token extracted from the write page
   */
  async function getOauthToken(url) {
    // Fetch /dropbox/write page
    const req = await fetch(url, {
      method: "GET",
      headers: new Headers({
        "X-Requested-With": "XMLHttpRequest",
      }),
    });
    const resp = await req.text(); // get response text
    const lines = resp.split("\n"); // split response text into lines

    // Find the line containing the OAuth token
    const tokenLine = lines.find(
      (line) => line.indexOf("var oauthToken =") !== -1
    );

    // Extract OAuth token from the JavaScript variable declaration
    if (tokenLine) {
      return tokenLine.split(" = ")[1].trim().slice(1, -2);
    }
  }

  /**
   * Handles data returned by the Google Drive Picker/popup
   * (visually)
   *
   * @param {*} data - The data returned by the Google Drive Picker popup
   */
  function handleDrivePickerResponse(data) {
    // if it wasn't canceled by user (data.canceled)
    if (!(data && data.canceled)) {
      if (data.action == google.picker.Action.PICKED) {
        // Show Gogole Drive table
        Element.show("tb_google_drive_stub");

        // The code below was adapted from the PowerSchool
        // hand-in page (with heavy stylistic modifications)

        // Get pre-existing documents (if they exist)
        let docs =
          $("#google_drive_files_list").data("google-drive-document-data") ||
          [];
        let newDocs = [];

        // Add newly selected documents to the doc list
        let documentIds = docs.map((value) => value.id); // pre-existing document ids
        data.docs.forEach((doc) => {
          if (documentIds.indexOf(doc.id) == -1) {
            newDocs.push(doc);
            docs.push(doc);
          }
        });

        // Present and store documents
        present_selected_files(newDocs);
        $("#google_drive_files_list").data("google-drive-document-data", docs);
      }
    }
  }

  /**
   * Shows a modal dialog for errors
   *
   * @param {Error} error - Error object
   */
  function showErrorDialog(error) {
    MD_alert(
      `<h1>Error</h1><p>${
        error && error.message
          ? error.message
          : error || "Unknown error occurred"
      }</p>`
    );
  }

  /**
   * Generates HTML content for the picker popup
   *
   * @param {string} oauthToken - The OAuth token needed for displaying the Google picker
   * @returns {string} HTML content for picker popup
   */
  const generatePickerHtml = (oauthToken) =>
    `<style>body{overflow:hidden}.picker-dialog{width:100%!important;height:100%!important;top:0!important;left:0!important}.picker-dialog-content{width:100%!important;height:100%!important}</style><div style="display: none;" id="pickerScript">var googleapis=document.createElement("script");googleapis.src="https://apis.google.com/js/api.js?onload=loadPicker";document.head.appendChild(googleapis);window.developerKey="AIzaSyAIp-SKWaTDGWQxUAMmZw6rU4JYB5NGXE8";window.pickerApiLoaded=!1;window.oauthToken="${oauthToken}";window.loadPicker=function(){gapi.load("picker",{callback:onPickerApiLoad})};
window.onPickerApiLoad=function(){pickerApiLoaded=!0;createPicker()};window.createPicker=function(){pickerApiLoaded&&oauthToken&&((new google.picker.View(google.picker.ViewId.DOCS)).setMimeTypes("image/png,image/jpeg,image/jpg"),(new google.picker.PickerBuilder).enableFeature(google.picker.Feature.NAV_HIDDEN).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(oauthToken).setDeveloperKey(window.developerKey).addView((new google.picker.DocsView).setIncludeFolders(!1).setMode(google.picker.DocsViewMode.LIST)).addView((new google.picker.DocsUploadView).setIncludeFolders(!0)).setCallback(pickerCallback).enableFeature(google.picker.Feature.SUPPORT_DRIVES).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).build().setVisible(!0))};
window.pickerCallback=function(a){a.action==google.picker.Action.PICKED?(window.opener.postMessage({drivePickerData:a},window.location.protocol+"//"+window.location.host),window.close()):a.action==google.picker.Action.CANCEL&&(window.opener.postMessage({drivePickerData:{canceled:true}},window.location.protocol+"//"+window.location.host),window.close())};</div><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" onload="eval(document.getElementById('pickerScript').innerText);document.getElementById('pickerScript').remove();this.remove();"/>`;

  // Add listener for when the picker window sends data
  window.addEventListener("message", function (message) {
    if (message.data.drivePickerData) {
      // Get data from Drive picker window
      const data = message.data.drivePickerData;
      // Handle the data accordingly
      handleDrivePickerResponse(data);
    }
  });

  // Add openPickerWindow function to window
  window.openPickerWindow = openPickerWindow;

  // Show message in console for prying eyes
  console.log("%cZane's Google Drive Workaround", "color:red;font-size:24px;");
  console.log(
    `%cv${window._DRIVE_FIX_VERSION} | Want to take a peek under the hood? See the code: https://github.com/zane-programs/pslearning-drive-picker-fix`,
    "font-size:15px;"
  );
})(window, jQuery);
