// run under node.js

const fs = require('fs');
const path = require('path');

let maxGroup = 2;
function groupCheck(file) {
    console.log(`Fetching group info from${file}`);

    try {
        const fileContent = fs.readFileSync(file, 'utf8');
        // const data = fs.readFile(file);
        const data = JSON.parse(fileContent);
        const atcCode = path.basename(file, '.json');

        const groupCount = Array.isArray(data.koko_luokitus) ? data.koko_luokitus.length : 1;

        if (groupCount > 1) {
            console.log(`${groupCount} groups identified for ATC ${atcCode}. Current max group being ${maxGroup}.`);
            if (groupCount > maxGroup) {
                maxGroup = groupCount;
            }
        }
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
}

/**
 * Finds group count for drug or drug group
 * @param {string[]} array containing code needed for JSON
 * @returns {Promise<void>}
 */
function jsonTraverse(jsonArray) {
    console.log(`Starting JSON retrieval for ${jsonArray.length} items.`);
    jsonArray.forEach(file => {
        groupCheck(file);
    });

}

// main()
try {
    const files = fs.readdirSync('.');
    const atcJSON = files.filter(e => {
        return path.extname(e) === '.json';
    });
    jsonTraverse(atcJSON);
} catch (err) {
    console.error("An error occurred during JSON file traversal:", err);
} finally {
    console.log(`Fetching completed with max group of ${maxGroup}.`);
}