// run under node.js

const fs = require('fs');
const fsp = require('fs/promises');
const axios = require('axios');

const readline = require('readline'); // For feeding cookie;
// const { group } = require('console');

const csv = require('csv-parser');

const intervalMin = 1000; // in milliseconds

let match = 0;
let maxGroup = 2;
/**
 * Finds Finnish name for a medicine using the Terveysportti JSON API.
 * @param {string} atcCode The ATC code to look up.
 * @returns {Promise<string>} The Finnish drug name.
 * @throws Will throw an error if the request fails or the response is invalid.
*/
const apiBase = "https://api.terveysportti.fi/la/classificationgroup/";
async function apiFetch(atcCode) {
    console.log(`Fetching ATC ${atcCode}`)
    const response = await axios.get(apiBase + atcCode, {
        headers: { 'Cookie': cookie }
    });
    const data = response.data;
    
    if (!data || !data.koko_luokitus) {
        throw new Error(`Unexpected API response for ${atcCode}.`);
    }
        
    const groupCount = Array.isArray(data.koko_luokitus) ? data.koko_luokitus.length : 1;
    
    if (groupCount > 1) {
        console.log(`${groupCount} groups identified for ATC ${atcCode}. Saving to JSON...`);
        const filename = atcCode +'.json';
        await fsp.writeFile(filename, JSON.stringify(data, null, 2));
        match++;
        if (groupCount > maxGroup) {
            maxGroup = groupCount;
        }
    }
}

let cookie = `duoauth=VFUDFKHP2UQ6J2MODL3BE0WT3CSK2630`;
// const inputArray = 


const atcFinalRegex = /^[A-Z]\d\d[A-Z][A-Z]\d\d/;

/** 
 * Reads CSV column for ATC code
 * @param {string} file CSV file path
 * @param {string} col Name of column ("ATC/LTK")
 * @return {Promise<string[]>} Array of unique codes
 */
function csvCodeFetch(file, col) {
    return new Promise((resolve, reject) => {
        const codes = new Set();
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (row) => {
                if (atcFinalRegex.test(row[col]) 
                    && row['Upper LTK group'].length 
                    && row['Upper LTK group'] !== '500') { 
                    codes.add(row[col]);
                }
            })
            .on('end', () => {
                console.log(`CSV file read with ${codes.size} unique ATC codes.`);
                resolve(Array.from(codes));
            })
            .on('error', (error) => {
                reject(error);
            });
    })
}

/**
 * Modifies cookies with user input
 * @returns {Promise<void>}
 */
function cookieFeed() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(`\n[Paste TP cookie]\nHere is how:\n
    1. On your work browser (Chrome/Edge/Firefox, etc.), visit https://www.terveysportti.fi/<name of your organizaiton> like https://www.terveysportti.fi/jamk.fi
    2. Press F12 key on the keyboard to open Developer Tools
    3. Go to Application tab
    4. From the menu on the left, select Storage -> Cookies
    5. Select the one under the Cookies with domain name https://www.terveysportti.fi/
    6. Manually copy the cookie value of duoauth in the form of
        VFUDFKHP2UQ6J2MODL3BE0WT3CSK2630
    7. Press Enter.\n`, (newCookie) => {
            cookie = `duoauth=` + newCookie.trim() + `;`;
            console.log('Received new cookie. Trying again...');
            rl.close();
            resolve();
        });
    })
}

/**
 * Iterate through 
 * Finds code for drug or drug group
 * Finds proper names (Finnish and English for ATC codes)
 * Writes findings to CSV
 * @param {string[]} array containing code needed for JSON
 * @returns {Promise<void>}
 */
async function arrayTraverse(array) {
    console.log(`Starting JSON retrieval for ${array.length} items.`);
    for (let i = 0; i < array.length; i++) {

        console.log(`Processing item ${i}...`);
        const startTime = Date.now();
        try {
            await apiFetch(array[i]); // Wait for drgVisit to complete before continuing
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
if (require.main == module) { // Call the async function
    // Using an async IIFE (Immediately Invoked Function Expression)
    (async () => {
        let atcArray = [];
        const launch = Date.now();
        try {
            atcArray = await csvCodeFetch('tdoi-drg.csv', 'ATC/LTK');
            console.log(atcArray);

            await cookieFeed();
            
            await arrayTraverse(atcArray);

        } catch (err) {
            console.error("An error occurred during array traversal:", err);
            // recorder.end(); // Ensure stream is closed on error too
        } finally {
            const terminate = Date.now() - launch;
            console.log(`Fetching completed with ${match} items out of ${atcArray.length}.`);
        }
    })();
}

// module.exports = {
//     atcFind,
//     atcToName,
//     drgVisit,
//     urlTraverse,
//     writeNewLine
// };