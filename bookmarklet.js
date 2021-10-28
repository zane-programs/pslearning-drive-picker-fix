(function(document) {
    if (document.querySelector("#zaneFix")) {
        openPickerWindow();
    } else {
        const pickerScript = document.createElement("SCRIPT");
        pickerScript.id = "zaneFix";
        pickerScript.src = "https://cdn.jsdelivr.net/gh/zane-programs/pslearning-drive-picker-fix@latest/fix.min.js";
        pickerScript.onload = () => openPickerWindow();
        document.head.appendChild(pickerScript);
    }
})(window.document);
