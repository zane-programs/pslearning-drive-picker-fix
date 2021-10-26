// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name default.js
// ==/ClosureCompiler==

// ADD YOUR CODE HERE
(function(document) {
    if (document.querySelector("#zaneFix")) {
        openPickerWindow();
    } else {
        const pickerScript = document.createElement("SCRIPT");
        pickerScript.id = "zaneFix";
        pickerScript.src = "https://rawcdn.githack.com/zane-programs/pslearning-drive-picker-fix/e8cfd92bbdee232f7f1b99d9ef541dd9c998d897/fix.v0.2.1.min.js"
        pickerScript.onload = () => openPickerWindow();
        document.head.appendChild(pickerScript);
    }
})(window.document);
