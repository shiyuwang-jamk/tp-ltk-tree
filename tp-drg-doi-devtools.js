// run under browser devTools with TP logged on e.g. https://www.terveysportti.fi/jamk.fi

// https://www.geeksforgeeks.org/javascript/javascript-program-to-write-data-in-a-text-file/

// const jsdom = require('jsdom');
const {
    parse
} = require('node-html-parser');

const tDOIHeader = 'drg';
const index0 = 51;
const count = 5;
// const interval = 5000; // in milliseconds

const baseURL = "https://www.terveysportti.fi/doi/" + tDOIHeader;

const filename = 'tdoi-' + tDOIHeader + '.txt';

// https://stackoverflow.com/questions/33418777/write-a-line-into-a-txt-file-with-node-js
const recorder = fs.createWriteStream(filename, {
    flags: 'a' // append
});

const writeNewLine = (line) => recorder.write('\n' + line);
const atcBase = "https://atcddd.fhi.no/atc_ddd_index/?code=";
const atcRegex = /^[A-Z]\d\d/gm;

function atcFind(url) {
    return url.split('/').at(-1);
}

async function atcToName(atc) {
    try {
        const response = await axios.get(atcBase + atc, {});
        // obtain text right after atc
        const drugName = parse(response.data).querySelector('div#content').outerText.split('\n' + atc + ' ')[1].split('\n')[0];

        console.log('Name for drug/drug group', atc, ": ", drugName);
        // fs.appendFile(filename, " = " + drugName, (err) => {
        //     if (err) {console.log(err); throw err;}
        // });

        // writeNewLine(tdoi + ": " + response.request.res.responseUrl);
        // writeNewLine(tdoi + ": " + atcFind(response.request.res.responseUrl));
        return drugName;
    } catch (error) {
        console.log('TDOI drg', tdoi, 'returns', error.status);
        writeNewLine(tdoi + ": " + error.status);
        return "N/A";
    }

}

const koodiRegex = /[A-Z]\d([A-Z]+|$)/gm;
function ltkToName(koodi, sivu) {
    return sivu.querySelectorAll("cdk-tree-node[_ngcontent-aie-c65] div.parent-node").at(-1).outerText;
}

// Find Finnish name for specific medicine with Kela lääkehaku
const atcFinalRegex=/^[A-Z]\d\d[A-Z][A-Z]\d\d/gm;
const kelaBase = "https://asiointi.kela.fi/laakekys_app/LaakekysApplication/Valmisteet?poimittuarvo=false&kieli=en&atcvnr=";
async function atcSuomeksi(koodi) {
    try {
        const response = await parse(axios.get(kelaBase + koodi, {}));
        return response.querySelectorAll('a#atclaake')[0].outerText;
    }
    catch (error) {
        return error;
    }
}

async function drgVisit(nro) {
    // return new Promise((resolve) => {
    const tdoi = ('00000' + nro).slice(-5);
    // window.open(baseURL + tdoi);

    // https://webscraping.ai/faq/javascript/how-do-i-handle-redirects-while-scraping-with-javascript
    // axios.get(baseURL + tdoi, {}).then(response => {
    try {
        const response = await axios.get(baseURL + tdoi, {
            headers: {
                // 'Cookie': 
            }
        });
        console.log('Final URL for TDOI drg', tdoi, ": ", response.request.res.responseUrl);
        // fs.appendFile('tdoi-drg.txt', tdoi + ": " + response.request.res.responseUrl, (err) => {
        //     if (err) {console.log(err); throw err;}
        // });

        // writeNewLine(tdoi + ": " + response.request.res.responseUrl);
        const atcCode = atcFind(response.request.res.responseUrl)
        writeNewLine(tdoi + ": " + atcFind(response.request.res.responseUrl));
        if (atcRegex.test(atcCode)) {
            recorder(await atcToName(atcCode));
        } else if (koodiRegex.test(atcCode)) {
            recorder(await ltkToName(atcCode, parse(response.data)));
        }

        // desired line format:
        // 00001: <ATC code / own grouping code> = <drug name or group name, if ATC code is found>
        // 00033: 404

        // resolve();
    } catch (error) {
        let statusMessage;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            statusMessage = `Status ${error.response.status}`;
            console.error('TDOI drg', tdoi, 'Error:', statusMessage, error.message);
        } else if (error.request) {
            // The request was made but no response was received
            statusMessage = 'No response received from server';
            console.error('TDOI drg', tdoi, 'Error:', statusMessage, error.message);
        } else {
            // Something happened in setting up the request that triggered an Error
            statusMessage = `Request setup error: ${error.message}`;
            console.error('TDOI drg', tdoi, 'Error:', statusMessage);
        }
        // writeNewLine(tdoi + ": " + error.status);
        writeNewLine(tdoi + ": " + statusMessage);
        // resolve();
    }
}



// https://coderwall.com/p/_ppzrw/be-careful-with-settimeout-in-loops
// function delay(index, time, func) {
//     setTimeout(() => {
//         func(index);
//     }, time);
// }

// function urlTraverse(alku, maara) {
//     for (let i = alku; i < alku + maara; i++) {
//         delay(i, interval, drgVisit);
//     }
// }

async function urlTraverse(alku, maara) {
    console.log(`Starting URL traversal from ${alku} for ${maara} items.`);
    for (let i = alku; i < alku + maara; i++) {
        console.log(`Processing item ${i}...`);
        await drgVisit(i); // Wait for drgVisit to complete before continuing
    }
    console.log("URL traversal complete. Closing file stream.");
    recorder.end();
}

// urlTraverse(index0, count);
// Call the async function
// Using an async IIFE (Immediately Invoked Function Expression)
(async () => {
    try {
        await urlTraverse(index0, count);
        console.log(`Data written to ${filename}`);
    } catch (err) {
        console.error("An error occurred during URL traversal:", err);
        recorder.end(); // Ensure stream is closed on error too
    }
})();

module.exports = {
    atcFind,
    atcToName,
    drgVisit,
    urlTraverse,
    writeNewLine
};