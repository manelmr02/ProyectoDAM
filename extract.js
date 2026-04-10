const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Temática y Mecánicas del Proyecto Intermodular LDF.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_content.txt', data.text);
}).catch(function(err) {
    console.error('Error parsing PDF:', err);
});
