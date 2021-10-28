"use strict";

(function (window) {
  window.addEventListener("message", function (message) {
    if (message.data.drivePickerData) {
      var data = message.data.drivePickerData;

      if (data.action == google.picker.Action.PICKED) {
        // show gdrive table
        tbGoogleDriveElements.each(Element.show);
        var docs = jQuery('#google_drive_files_list').data('google-drive-document-data');
        var new_docs = [];
        if (docs === undefined) docs = [];
        data.docs.each(function (doc) {
          document_ids = docs.map(function (value) {
            return value.id;
          });

          if (jQuery.inArray(doc.id, document_ids) == -1) {
            new_docs.push(doc);
            docs.push(doc);
          }
        });
        present_selected_files(new_docs);
        jQuery('#google_drive_files_list').data('google-drive-document-data', docs);
      } else {
        // show gdrive table
        tbGoogleDriveElements.each(Element.hide);
      }
    }
  });

  function openPickerWindow() {
    return Promise.resolve().then(function () {
      const thickboxContent = document.querySelector("#TB_ajaxContent");

      if (!thickboxContent) {
        throw new Error("Hand-in page not present");
      }

      return getOauthToken(thickboxContent.getAttribute("tburl"));
    }).then(function (_resp) {
      const token = _resp;
      let pickerWin = window.open("https://windward.learning.powerschool.com/images/picker", null, "width=800,height=600");
      pickerWin.addEventListener("load", function () {
        pickerWin.document.documentElement.innerHTML = generatePickerHtml(token);
        pickerWin.document.title = "Google Drive Picker";
      });
    });
  }

  function getOauthToken(url) {
    return Promise.resolve().then(function () {
      return fetch(url, {
        method: "GET",
        headers: new Headers({
          "X-Requested-With": "XMLHttpRequest"
        })
      });
    }).then(function (_resp) {
      const req = _resp;
      return req.text();
    }).then(function (_resp) {
      const lines = _resp.split("\n");

      const tokenLine = lines.find(function (line) {
        return line.indexOf("var oauthToken =") !== -1;
      });

      if (tokenLine) {
        return tokenLine.split(" = ")[1].trim().slice(1, -2);
      }
    });
  }

  const generatePickerHtml = function (oauthToken) {
    return `<style>body{overflow:hidden}.picker-dialog{width:100%!important;height:100%!important;top:0!important;left:0!important}.picker-dialog-content{width:100%!important;height:100%!important}</style><div style="display: none;" id="pickerScript">var googleapis=document.createElement("script");googleapis.src="https://apis.google.com/js/api.js?onload=loadPicker";document.head.appendChild(googleapis);window.developerKey="AIzaSyAIp-SKWaTDGWQxUAMmZw6rU4JYB5NGXE8";window.clientId="1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com";window.appId="1234567890";window.scope=["https://www.googleapis.com/auth/drive.file"];window.pickerApiLoaded=!1;window.oauthToken="${oauthToken}";window.loadPicker=function(){gapi.load("picker",{callback:onPickerApiLoad})};
window.onPickerApiLoad=function(){pickerApiLoaded=!0;createPicker()};window.createPicker=function(){pickerApiLoaded&&oauthToken&&((new google.picker.View(google.picker.ViewId.DOCS)).setMimeTypes("image/png,image/jpeg,image/jpg"),(new google.picker.PickerBuilder).enableFeature(google.picker.Feature.NAV_HIDDEN).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(oauthToken).setDeveloperKey(window.developerKey).addView((new google.picker.DocsView).setIncludeFolders(!1).setMode(google.picker.DocsViewMode.LIST)).addView((new google.picker.DocsUploadView).setIncludeFolders(!0)).setCallback(pickerCallback).enableFeature(google.picker.Feature.SUPPORT_DRIVES).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).build().setVisible(!0))};
window.pickerCallback=function(a){a.action==google.picker.Action.PICKED?(window.opener.postMessage({drivePickerData:a},window.location.protocol+"//"+window.location.host),window.close()):a.action==google.picker.Action.CANCEL&&window.close()};</div><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" onload="eval(document.getElementById('pickerScript').innerText);document.getElementById('pickerScript').remove();this.remove();"/>`;
  }; // run openPickerWindow


  window.openPickerWindow = function () {
    openPickerWindow().catch(function (error) {
  	  MD_alert(`<h1>Error</h1><p>${error}`);
	  });
  };
})(window);
