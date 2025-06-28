// Import
const axios = require('axios');
// const { atcFind, atcToName, drgVisit } = require('./tp-drg-doi-node.js');
// Testing atcToName
const { atcToName, atcFind,  } = require('./tp-drg-doi-node.js');

jest.mock('axios');
// const fs = require('fs');

// Jest test

// fs
// let capture = [];
// const write = {
//     write: (chunk) => {
//         output.push(chuck);
//         return true;
//     },
//     end: jest.fn(),
// };
// return local test
// jest.spyOn(fs, 'createWriteStream').m

describe('atcToName', () => {

    beforeEach(() => {
        axios.get.mockClear();
    });

    test('Upon ATC code for a full substance, return its correct name', async () => {
        const atcCode = 'L04AA24';
        const name = 'abatacept';
        const mockHTML = `
            <html><body>
            <div id="content">
                <p align="right"><a href="./">New search</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="./?code=L04AA24&amp;showdescription=yes">Show text from Guidelines</a></p>L <b><a href="./?code=L&amp;showdescription=yes">ANTINEOPLASTIC AND IMMUNOMODULATING AGENTS</a></b><br>
                L04 <b><a href="./?code=L04&amp;showdescription=no">IMMUNOSUPPRESSANTS</a></b><br>
                L04A <b><a href="./?code=L04A&amp;showdescription=no">IMMUNOSUPPRESSANTS</a></b><br>
                L04AA <b><a href="./?code=L04AA&amp;showdescription=no">Selective immunosuppressants</a></b><br>
                <p></p><ul><table cellpadding="0" cellspacing="0" border="0">
                <tbody><tr><td>ATC code&nbsp;&nbsp;</td><td>Name&nbsp;&nbsp;</td><td>DDD&nbsp;</td><td align="center">&nbsp;U&nbsp;</td><td>Adm.R</td><td>&nbsp;Note</td></tr>
                <tr><td>L04AA24&nbsp;</td><td><a href="./?code=L04AA24&amp;showdescription=yes">abatacept</a>&nbsp;</td><td align="right">27&nbsp;</td><td align="right">mg&nbsp;</td><td>P&nbsp;</td><td align="left"></td></tr></tbody></table></ul><p><a href="/atc_ddd_alterations__cumulative/ddd_alterations/abbrevations/">List of abbreviations</a></p>
                <div id="last_updated">
                <p><i>Last updated: 
                2024-12-27</i></p>
                </div>
            </div>
            </body></html>
        `;

        axios.get.mockResolvedValue({
            data: mockHTML
        });

        const result = await atcToName(atcCode);

        expect(result).toBe(name);
    });

    test('Upon ATC code for a category, return its correct name', async () => {
        const atcCode = 'L04AA';
        const name = 'Selective immunosuppressants';
        const mockHTML = `
            <html><body>
            <div id="content">
                <p align="right"><a href="./">New search</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="./?code=L04AA&amp;showdescription=yes">Show text from Guidelines</a></p>L <b><a href="./?code=L&amp;showdescription=yes">ANTINEOPLASTIC AND IMMUNOMODULATING AGENTS</a></b><br>
                L04 <b><a href="./?code=L04&amp;showdescription=no">IMMUNOSUPPRESSANTS</a></b><br>
                L04A <b><a href="./?code=L04A&amp;showdescription=no">IMMUNOSUPPRESSANTS</a></b><br>
                L04AA <b><a href="./?code=L04AA&amp;showdescription=no">Selective immunosuppressants</a></b><br>
                <p></p><ul><table cellpadding="0" cellspacing="0" border="0">
                <tbody><tr><td>ATC code&nbsp;&nbsp;</td><td>Name&nbsp;&nbsp;</td><td>DDD&nbsp;</td><td align="center">&nbsp;U&nbsp;</td><td>Adm.R</td><td>&nbsp;Note</td></tr>
                <tr><td>L04AA03&nbsp;</td><td><a href="./?code=L04AA03&amp;showdescription=yes">antilymphocyte immunoglobulin (horse)</a>&nbsp;</td><td align="right">1.05&nbsp;</td><td align="right">g&nbsp;</td><td>P&nbsp;</td><td align="left"></td></tr><tr><td>L04AA04&nbsp;</td><td><a href="./?code=L04AA04&amp;showdescription=yes">antithymocyte immunoglobulin (rabbit)</a>&nbsp;</td><td align="right">0.1&nbsp;</td><td align="right">g&nbsp;</td><td>P&nbsp;</td><td align="left"></td></tr><tr><td>L04AA06&nbsp;</td><td><a href="./?code=L04AA06&amp;showdescription=yes">mycophenolic acid</a>&nbsp;</td><td align="right">2&nbsp;</td><td align="right">g&nbsp;</td><td>O&nbsp;</td><td align="left">as mycophenolate mofetil</td></tr><tr><td></td><td></td><td align="right">2&nbsp;</td><td align="right">g&nbsp;</td><td>P&nbsp;</td><td align="left">as mycophenolate mofetil</td></tr><tr><td>L04AA15&nbsp;</td><td><a href="./?code=L04AA15&amp;showdescription=yes">alefacept</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr><tr><td>L04AA19&nbsp;</td><td><a href="./?code=L04AA19&amp;showdescription=yes">gusperimus</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr><tr><td>L04AA22&nbsp;</td><td><a href="./?code=L04AA22&amp;showdescription=yes">abetimus</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr><tr><td>L04AA24&nbsp;</td><td><a href="./?code=L04AA24&amp;showdescription=yes">abatacept</a>&nbsp;</td><td align="right">27&nbsp;</td><td align="right">mg&nbsp;</td><td>P&nbsp;</td><td align="left"></td></tr><tr><td>L04AA28&nbsp;</td><td><a href="./?code=L04AA28&amp;showdescription=yes">belatacept</a>&nbsp;</td><td align="right">12.5&nbsp;</td><td align="right">mg&nbsp;</td><td>P&nbsp;</td><td align="left"></td></tr><tr><td>L04AA32&nbsp;</td><td><a href="./?code=L04AA32&amp;showdescription=yes">apremilast</a>&nbsp;</td><td align="right">60&nbsp;</td><td align="right">mg&nbsp;</td><td>O&nbsp;</td><td align="left"></td></tr><tr><td>L04AA40&nbsp;</td><td><a href="./?code=L04AA40&amp;showdescription=yes">cladribine</a>&nbsp;</td><td align="right">0.34&nbsp;</td><td align="right">mg&nbsp;</td><td>O&nbsp;</td><td align="left"></td></tr><tr><td>L04AA41&nbsp;</td><td><a href="./?code=L04AA41&amp;showdescription=yes">imlifidase</a>&nbsp;</td><td align="right">17.5&nbsp;</td><td align="right">mg&nbsp;</td><td>P&nbsp;</td><td align="left">course dose</td></tr><tr><td>L04AA48&nbsp;</td><td><a href="./?code=L04AA48&amp;showdescription=yes">belumosudil</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr><tr><td>L04AA58&nbsp;</td><td><a href="./?code=L04AA58&amp;showdescription=yes">efgartigimod alfa</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr><tr><td>L04AA60&nbsp;</td><td><a href="./?code=L04AA60&amp;showdescription=yes">remibrutinib</a>&nbsp;</td><td align="right">&nbsp;</td><td align="right">&nbsp;</td><td>&nbsp;</td><td align="left"></td></tr></tbody></table></ul><p><a href="/atc_ddd_alterations__cumulative/ddd_alterations/abbrevations/">List of abbreviations</a></p>
                <div id="last_updated">
                <p><i>Last updated: 
                2024-12-27</i></p>
                </div>
                </div>
            </html></body>
        `;

        axios.get.mockResolvedValue({
            data: mockHTML
        });

        const result = await atcToName(atcCode);

        expect(result).toBe(name);
    });

    test('Upon invalid code, return default N/A', async () => {
        const atcCode = 'V03ABXX';
        const name = 'ATCDDD N/A';
        const mockHTML = `
            <html><body>
                <div id="content">
                    <p align="right"><a href="./">New search</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="./?code=V03ABXX&amp;showdescription=no">Hide text from Guidelines</a></p><p></p><p><a href="/atc_ddd_alterations__cumulative/ddd_alterations/abbrevations/">List of abbreviations</a></p>
                    <div id="last_updated">
                    <p><i>Last updated: 
                    2024-12-27</i></p>
                    </div>
                    </div>
            </html></body>
        `;

        axios.get.mockResolvedValue({
            data: mockHTML
        });

        const result = await atcToName(atcCode);

        expect(result).toBe(name);
    });

    test('Upon network error, return default N/A', async () => {
        const atcCode = 'L04AA24';
        const name = 'ATCDDD N/A';
        
        axios.get.mockRejectedValue(new Error('Network error'));

        const result = await atcToName(atcCode);

        expect(result).toBe(name);
    });
});
describe('atcFind', () => {

    test('Return the last part of the LTK URL', async () => {
        const ltkURL = 'https://www.terveysportti.fi/apps/laake/laakeryhma/L04AA24';
        const atcCode = 'L04AA24';

        const result = atcFind(ltkURL);

        expect(result).toBe(atcCode);
    });

    
});

