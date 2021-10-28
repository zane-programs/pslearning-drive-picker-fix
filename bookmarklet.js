(function(document) {
    if (document.querySelector("#zaneFix")) {
        openPickerWindow();
    } else {
        const pickerScript = document.createElement("SCRIPT");
        pickerScript.id = "zaneFix";
        pickerScript.src = "https://cdn.jsdelivr.net/gh/zane-programs/pslearning-drive-picker-fix@de409ccff0c50261c3231843bfff1168140dfdae/fix.v0.2.2.min.js";
        pickerScript.onload = () => openPickerWindow();
        document.head.appendChild(pickerScript);
    }
})(window.document);
