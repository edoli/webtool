/* extensions */
HTMLCollection.prototype.forEach = Array.prototype.forEach;

/* Promises */
const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        
        reader.readAsText(file);
    });
};

const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        
        reader.readAsArrayBuffer(file);
    });
};

/* common components */
const dropAreas = document.getElementsByClassName('drop-area');

dropAreas.forEach(dropArea => {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }
});

const checkboxs = document.querySelectorAll('checkbox');
checkboxs.forEach(checkbox => {
    const checkType = checkbox.getAttribute('check-type') || 'checkmark';
    const label = document.createElement('label');
    label.className += ' checkbox-wrapper';
    label.innerHTML = `
        <input type="checkbox" id="${checkbox.id}">
        <span class="${checkType}"></span>
        ${checkbox.textContent}
    `;
    checkbox.parentNode.replaceChild(label, checkbox);
});

/* Toast */
let toastContainer;
function showToast(message, type = "primary") {
    if (toastContainer === undefined || toastContainer === null) {
        toastContainer = document.createElement("div");
        toastContainer.id = 'toast-container';
        document.getElementsByTagName('body')[0].appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.classList.add("toast", `toast-${type}`);
    toast.textContent = message;

    toast.addEventListener("click", () => toast.remove());

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}