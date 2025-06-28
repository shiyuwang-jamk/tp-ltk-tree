// run under node.js

const fs = require('fs');
const path = require('path');

let maxGroup = 2;
function groupCheck(file) {
    console.log(`Fetching group info from${file}`);
    
    const data = fs.readFile(file);
    
    const groupCount = Array.isArray(data.koko_luokitus) ? data.koko_luokitus.length : 1;
    
    if (groupCount > 1) {
        console.log(`${groupCount} groups identified for ATC ${atcCode}. Current max group being ${maxGroup}.`);
        
        if (groupCount > maxGroup) {
            match++;
            maxGroup = groupCount;
        }
    }
}

/**
 * Iterate through 
 * Finds code for drug or drug group
 * Finds proper names (Finnish and English for ATC codes)
 * Writes findings to CSV
 * @param {string[]} array containing code needed for JSON
 * @returns {Promise<void>}
 */
async function jsonTraverse(array) {
    console.log(`Starting JSON retrieval for ${array.length} items.`);
    for (let i = 0; i < array.length; i++) {

        console.log(`Processing item ${i}...`);
        const startTime = Date.now();
        try {
            await groupCheck(array[i]); // Wait for drgVisit to complete before continuing
        } catch (err) {
            console.error("An error occurred during array traversal:", err);
            // recorder.end(); // Ensure stream is closed on error too
        }

        const duration = Date.now() - startTime;
        const itemsLeft = array.length - i;
        console.log(`> Iteration ${i} completed in ${duration} ms. ${itemsLeft} itemsleft`);

        if (duration < intervalMin) {
            const timeout = intervalMin - duration;
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }
}

// main()

try {
    fs.readdir('.', function (err, files) {
        const atcJSON = files.filter(e => path.extname(e) === '.json');
        jsonTraverse(atcJSON);
    })
} catch (err) {
    console.error("An error occurred during array traversal:", err);
    // recorder.end(); // Ensure stream is closed on error too
} finally {
    console.log(`Fetching completed with ${match} items out of ${atcArray.length}.`);
}

// module.exports = {
//     atcFind,
//     atcToName,
//     drgVisit,
//     urlTraverse,
//     writeNewLine
// };