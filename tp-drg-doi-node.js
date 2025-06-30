// run under node.js

/**
 * Version 1.0.1 (2025-06-28)
 * Author: Shiyu "Simo" Wang
 * With guidance from GitHub Copilot.
 */

// https://www.geeksforgeeks.org/javascript/javascript-program-to-write-data-in-a-text-file/
const fs = require('fs'); // no DevTools
const axios = require('axios');
// const jsdom = require('jsdom');
const {
    parse
} = require('node-html-parser');
const readline = require('readline'); // For feeding cookie;

const index0 = 1711;
// const index0 = 9953; // reverse?
const count = 5;
const final = index0+count-1;
const intervalDefault = 2500; // in milliseconds
let intervalMin = intervalDefault; // in milliseconds
let interval404 = 200; // shorter if 404

const tDOIHeader = 'drg';
const filename = 'tdoi-' + tDOIHeader + '-' + index0 + + '-' + final + Date.now() +'.csv';
// const filename = 'tdoi-' + tDOIHeader + '-' + index0 + '-' + final + '-' + Date.now() +'.csv';
const fileExists = fs.existsSync(filename);

// https://stackoverflow.com/questions/33418777/write-a-line-into-a-txt-file-with-node-js
const recorder = fs.createWriteStream(filename, {
    flags: 'a', // append
    encoding: 'utf-8' // UTF-8 for Excel import
});

if (!fileExists) {
    recorder.write('\uFEFF'); // BOM character for Excel import
    recorder.write('TDOI,ATC/LTK,English,Finnish,"Upper LTK group","LTK group name"');
}

const writeNewLine = (line) => recorder.write('\n' + line);

function csvEscape(field) {
    const fieldStr = String(field);
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        // Escape double quotes by doubling them, then wrap the whole field in double quotes.
        return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
}

const baseURL = "https://www.terveysportti.fi/doi/" + tDOIHeader;

const atcBase = "https://atcddd.fhi.no/atc_ddd_index/?code=";
const atcSimp = "&showdescription=no";

function atcFind(url) {
    // return url.split('/').at(-1);
    return url.split('/').filter(Boolean).pop();
}

const atcFinalRegex = /^[A-Z]\d\d[A-Z][A-Z]\d\d/;
/**
 * Find English name for specific medicine with ATCDDD
 * @param {string} atc = ATC code
 * @returns {Promise<string>} English drug name : N/A
 */
async function atcToName(atc) {
    let name = 'ATCDDD N/A';
    try {
        const response = await axios.get(atcBase + atc + atcSimp, {});

        const content = parse(response.data).querySelector(`div#content`);
        if (!content) {
            return name;
        }

        let nameCandidate;
        if (atcFinalRegex.test(atc)) {
            nameCandidate = content.querySelector(`td a[href='./?code=${atc}&showdescription=yes']`); // used NO version in current page
        } else { // An ATC code nevertheless
            nameCandidate = content.querySelector(`b a[href='./?code=${atc}&showdescription=no']`);
        }
        if (nameCandidate) {
            name = nameCandidate.innerText.trim();
        }
    } catch (error) {
        // console.log('TDOI drg', tdoi, 'returns', error.status);
        // writeNewLine(tdoi + ": " + error.status);
        console.log(`Error fetching English name from ATCDDD for code ${atc}:`, error.message);

    }
    return name;
}

/**
 * Back-up option: Find Finnish name for specific medicine with Kela lääkehaku
 * @param {string} code = ATC code
 * @returns {Promise<string>} Finnish drug name : N/A
 */
const kelaBase = "https://asiointi.kela.fi/laakekys_app/LaakekysApplication/Valmisteet?poimittuarvo=false&kieli=en&atcvnr=";
async function atcFin(code) {
    try {
        const response = parse((await axios.get(kelaBase + code, {})).data);
        // return response.querySelectorAll('a#atclaake')[0].outerText;
        const nameFin = response.querySelector('a#atclaake');

        if (nameFin) {
            return nameFin.outerText.trim();
        } else {
            console.log(`No Finnish name found on Kela for code ${code}`);
            return "N/A Kela";
        }
    } catch (error) {
        console.log(`Error from Kela for code ${code}`);
        return "N/A Kela";
    }
}

/**
 * Finds Finnish name for a medicine using the Terveysportti JSON API.
 * @param {string} atcCode The ATC code to look up.
 * @returns {Promise<string>} The Finnish drug name.
 * @throws Will throw an error if the request fails or the response is invalid.
*/
const apiBase = "https://api.terveysportti.fi/la/classificationgroup/";
async function apiToName(atcCode) {
    const response = await axios.get(apiBase + atcCode, {
        headers: { 'Cookie': cookie }
    });
    const data = response.data;
    if (data && data.avattavat && data.avattavat.length > 0) {
        const lastItem = data.avattavat.at(-1);
        const upperItem = data.avattavat.length > 1 ? data.avattavat.at(-2) : null;
        
        // if (lastItem && lastItem.kuvaus && lastItem.ylatunnus) {
        //     return { lastItem.kuvaus.trim(), lastItem.ylatunnus.trim() };
        // } else if (lastItem && lastItem.kuvaus) {
        //     return lastItem.kuvaus.trim();
        // }
        return {
            name: (lastItem && lastItem.kuvaus) ? lastItem.kuvaus.trim() : 'N/A JSON API',
            upperCode: (upperItem && upperItem.tunnus) ? upperItem.tunnus.trim() : 'N/A JSON API',
            upperName: (upperItem && upperItem.kuvaus) ? upperItem.kuvaus.trim() : 'N/A JSON API',
        };
    }
    // If we get here, the data structure was not as expected.
    throw new Error(`API response for ${atcCode} had an unexpected structure.`);
}

/**
 * Find Finnish name for specific medicine from the resulting main node tree in the search results
 * @param {string} code = ATC code
 * @returns {Promise<string>} Finnish drug name : N/A
 */
// async function ltkToName(code, sivu) {
    
//     // HTML scraping won't work with Axios
//     // const nodes = sivu.querySelectorAll("cdk-tree-node[_ngcontent-aie-c65] div.parent-node"); // Dynamic class name, won't work
//     // const nodes = sivu.querySelectorAll("div#articleElement app-searchresult cdk-tree-node div.parent-node");
//     let name = 'N/A LTK';
//     if (nodes.length > 0) {
//         name = nodes.at(-1).outerText.trim();
//         // return last.outerText.trim();
//         // } else if (atcFinalRegex.test(code)) {
//         //     console.log(`No LTK name found for ATC code ${code}. Trying Kela name instead.`);
//         //     name = await atcFin(code);
//     }

//     return name;
// }

let cookie = ``;

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

// 29.6.25: canceling the edge detect, e.g. drg09615
// let edgeCounter = 0;
// let edgeThreshold = 5;
// const codeRegex = /[A-Z]\d([A-Z]+|$)/; // non-ATC coding like R1C
const atcRegex = /^[A-Z]\d\d/;
/**
 * Main action fetching one TDOI page
 * Finds code for drug or drug group
 * Finds proper names (Finnish and English for ATC codes)
 * Writes findings to CSV
 * @param {string} nro Sequence of drg TDOI
 * @returns {Promise<void>}
 */
async function drgVisit(nro) {
    // return new Promise((resolve) => {
    const tdoi = ('00000' + nro).slice(-5);
    intervalMin = intervalDefault; // init

    // https://webscraping.ai/faq/javascript/how-do-i-handle-redirects-while-scraping-with-javascript
    // axios.get(baseURL + tdoi, {}).then(response => {
    let urlResponse; // for ATC/LTK code
    try { 
        urlResponse = await axios.get(baseURL + tdoi, { maxRedirects: 0 });
    } catch (error) {
        urlResponse = error.response;
    }
    if (!urlResponse) {
        throw new Error(`TDOI drg${tdoi}: Failed with no response. Check network connection.`, urlResponse.message);
        // writeNewLine([tdoi, 'No response', '', ''].map(csvEscape).join(','));
        // process.abort();
    }
    
    // const statusCode = error.response.status;
    // const headers = error.response.headers;
    const { status, headers } = urlResponse;
    
    if (status >= 300 && status < 400 && headers.location) {
        const atcCode = atcFind(headers.location);
        console.log('ATC/LTK code for TDOI drg', tdoi, ": ", atcCode);
        let name = 'N/A';
        if (atcRegex.test(atcCode)) {
            // recorder.write(','+ await atcToName(atcCode));
            name = await atcToName(atcCode);
        }

        // let nameFin = 'Try again';
        try { // for Finnish name
            // const response = await axios.get(headers.location, { headers: { 'Cookie': cookie } });
            const apiData = await apiToName(atcCode);
            writeNewLine([
                tdoi,
                atcCode, 
                name, 
                apiData.name,
                apiData.upperCode,
                apiData.upperName
            ].map(csvEscape).join(','));
            // edgeCounter = 0;
            return;
        } catch (fetchError) {
            if (fetchError.response && fetchError.response.status !== 403) { // Access to LTK failed

                console.error(`TDOI drg${tdoi}=${atcCode}: fetch failed.`, fetchError.message);
                writeNewLine([
                    tdoi, 
                    atcCode, 
                    name,
                    fetchError.response.status,
                    'Check manually',
                    ''
                ].map(csvEscape).join(','));
                // edgeCounter = 0;
                return;

            }

            if (atcFinalRegex.test(atcCode)) { // Falling back to Kela for substance names
                console.log(`TDOI drg${tdoi}=${atcCode}: cookie feed failed. Salvaging from Kela for Finnish name.`);
                writeNewLine([
                    tdoi, 
                    atcCode, 
                    name, 
                    await atcFin(atcCode), 
                    'KELA', 
                    'KELA'].map(csvEscape).join(','));
                // edgeCounter = 0;
                return;
            } else { // Try again for group name
                console.error(`TDOI drg${tdoi}: No access/cookie expired. For the class ${atcCode}, generate a new cookie?`);
                await cookieFeed();

                try {
                    const response = await axios.get(headers.location, {
                        headers: {
                            'Cookie': cookie
                        }
                    });
                    const apiData = await apiToName(atcCode);
                    writeNewLine([
                            tdoi,
                            atcCode, 
                            name, 
                            apiData.name,
                            apiData.upperCode,
                            apiData.upperName
                        ].map(csvEscape).join(','));
                        // edgeCounter = 0;
                } catch (error2) {
                    console.error(`TDOI drg${tdoi}=${atcCode}: class fetch failed.`, error2.message);
                    writeNewLine([
                        tdoi,
                        atcCode,
                        name,
                        error2.status,
                        '',
                        ''].map(csvEscape).join(','));

                }
                // edgeCounter = 0;
                return;
            }
        }
    // } else if (status === 404) {
    //     edgeCounter++;
    //     if (edgeCounter > edgeThreshold) {
    //         const since = nro - edgeCounter;
    //         throw new Error(`TDOI drg${tdoi}: 404 since`, since);
    //     }
    } else {
    // if (status < 300 || !headers.location) {
        console.error(`TDOI drg${tdoi}: error occurred on first redirection.`, status);
        writeNewLine([tdoi, status, '','','',''].map(csvEscape).join(','));
        intervalMin = interval404;
    }
        
        // process.abort();
}

// https://coderwall.com/p/_ppzrw/be-careful-with-settimeout-in-loops
// function delay(index, time, func) {
//     setTimeout(() => {
//         func(index);
//     }, time);
// }

// function urlTraverse(start, count) {
//     for (let i = start; i < start + count; i++) {
//         delay(i, interval, drgVisit);
//     }
// }

/**
 * Iterate through 
 * Finds code for drug or drug group
 * Finds proper names (Finnish and English for ATC codes)
 * Writes findings to CSV
 * @param {number} start starting index number
 * @param {number} count the amount of work to do
 * @returns {Promise<void>}
 */
async function urlTraverse(start, count) {
    console.log(`Starting URL traversal from ${start} for ${count} items.`);
    for (let i = start; i < start + count; i++) {
    // for (let i = start; i > start - count; i--) { // reverse?
        const startTime = Date.now();

        console.log(`Processing item ${i}...`);
        await drgVisit(i); // Wait for drgVisit to complete before continuing

        const duration = Date.now() - startTime;
        const itemsLeft = start + count - i;
        // const itemsLeft = start - count + i; // reverse
        console.log(`> Iteration ${i} completed in ${duration} ms. ${itemsLeft} TDOIs left`);

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
        try {
            await cookieFeed();
            await urlTraverse(index0, count);
            console.log(`Data written to ${filename}`);
        } catch (err) {
            console.error("An error occurred during URL traversal:", err);
            // recorder.end(); // Ensure stream is closed on error too
        } finally {
            console.log("URL traversal complete. Closing file stream.");
            recorder.end();
        }
    })();
}

module.exports = {
    atcFind,
    atcToName,
    drgVisit,
    urlTraverse,
    writeNewLine,
    cookieFeed,
    get cookie() { return cookie; },
    recorder,
    fileExists,
    get atcBase() { return atcBase; },
    get atcSimp() { return atcSimp; },
    csvEscape
};