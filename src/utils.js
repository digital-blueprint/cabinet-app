export const pascalToKebab = (str) => {
    // Replace capital letters with hyphen followed by the lowercase equivalent
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

export const dataURLtoFile = (dataURL, filename) => {
    // Extract the MIME type and base64 data
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);

    // Convert base64 to binary
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    // Create and return the File object
    return new File([u8arr], filename, { type: mime });
};
