// run under node.js

/**
 * Version 1.0.0 (2025-06-29)
 * Author: Shiyu "Simo" Wang
 */

const fs = require('fs');
const axios = require('axios');
const { parse } = require('node-html-parser'); // To fetch ATCDDD name
const csv = require('csv-parser'); // To utilize TDOI CSV

const tplib = require('./tp-drg-doi-node.js');

const intervalMin = 1000; // in milliseconds

const filename = `tree-api-${Date.now()}.csv`;

const recorder = fs.createWriteStream(filename, {
    flags: 'a', // append
    encoding: 'utf-8' // UTF-8 for Excel import
});
const fileExists = fs.existsSync(filename);
if (!fileExists) {
    console.log(`Writing to file ${filename}`);
    recorder.write('\uFEFF'); // BOM character for Excel import
    recorder.write('item,lvl,ATC/ID,catSeq,Finnish,English,TDOI');
}
const writeNewLine = (line) => recorder.write('\n' + line);
/** 
 * Reads CSV column for English name and TDOI
 * @param {string} file CSV file path
 * @param {string} col Name of column ("ATC/LTK")
 * @return {Promise<string[]>} Array of unique codes
 */
function csvQuery(id, col) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream('tdoi-drg.csv');
        stream
            .pipe(csv())
            .on('data', (row) => {
                if (row.ID === id) {
                    stream.destroy();
                    resolve(row[col]);
                }
            })
            .on('end', () => {
                if (col === 'English') {
                    resolve(atcToName(id));
                } else {
                    resolve('NOTDOI');
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    })
}

/**
 * Backup: Find English name for specific medicine from ATCDDD
 * @param {string} atc = ATC code
 * @returns {Promise<string>} English drug name : N/A
 */
async function atcToName(atc) {
    let name = 'ATCDDD N/A';
    try {
        const response = await axios.get(tplib.atcBase + atc + tplib.atcSimp, {});

        const content = parse(response.data).querySelector(`div#content`);
        if (!content) {
            return name;
        }

        let nameCandidate = content.querySelector(`td a[href='./?code=${atc}&showdescription=yes']`); // used NO version in current page
        if (nameCandidate) {
            name = nameCandidate.innerText.trim();
        }
    } catch (error) {
        console.log(`Error fetching English name from ATCDDD for code ${atc}:`, error.message);
    }
    return name;
}


const apiBase = "https://api.terveysportti.fi/la/classifications";
const apiBaseChild = "https://api.terveysportti.fi/la/classifications/classification/";
const itemSeq = 1;
/**
 * Main action fetching one TDOI page
 * Finds code for drug or drug group
 * Finds proper names (Finnish and English for ATC codes)
 * Writes findings to CSV
 * @param {string} nro Sequence of drg TDOI
 * @returns {Promise<void>}
 */
async function classVisit(id, level) {
    try {
        let url = level === 1 ? apiBase : apiBaseChild + id;
        console.log(`Requesting nodes of `, level === 1 ? `root` : `parent ${id}.`);
        const response = await axios.get(url, {
            headers: {
                'Cookie': tplib.cookie
            }
        });
        const nodes = response.data;
        if (level === 1) {
            nodes.forEach(element => {
                element.leaf = Boolean(JSON.parse(element.leaf.toLowerCase()));
            });
        }

        for (let i = 0; i < nodes.length; i++) {
            const taskStart = Date.now();
            const node = nodes[i];

            const currentCatSeq = (level === 1) ? i + 1 : node.order;

            const engName = node.leaf ? await csvQuery(node.id, 'English') : '';
            const TDOI = await csvQuery(node.id, 'TDOI');

            writeNewLine([
                itemSeq,
                level,
                node.id,
                currentCatSeq,
                node.name,
                engName,
                TDOI
            ].map(tplib.csvEscape).join(','));

            const elapsed = Date.now() - taskStart;
            console.log(`A level ${level}`, node.leaf ? `Final node` : `non-final node`, `written.`);
            itemSeq++;
            if (elapsed < intervalMin) {
                const timeout = intervalMin - elapsed;
                await new Promise(resolve => setTimeout(resolve, timeout));
            }
            if (!node.leaf) {
                // const childID = '/classification/'+node.id;
                console.log('Parent node detected.');
                await classVisit(node.id, level + 1);

                
            }
        }
    } catch (error) {
        console.error('Error from classVisit():', error);
    }
}

// main()
if (require.main == module) {
    (async () => {
        try {
            await tplib.cookieFeed();
            await classVisit("", 1);
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

// module.exports = {
//     atcFind,
//     atcToName,
//     drgVisit,
//     urlTraverse,
//     writeNewLine
// };