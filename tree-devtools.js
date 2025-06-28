const delayReal = ms => new Promise(resolve => setTimeout(resolve, ms));
let delayBase = 3000;
let delayMul = 2;

// (async () => { // direct execution
let expandCurrent = async () => {
    const elements = document.querySelectorAll('app-dynamictree cdk-tree-node[aria-expanded="false"]:not([aria-level="1"]) button');
    let clickCount = 0;
    let skipCount = 0;
    for (const e of elements) {
        if (!(/[A-Z]\d\d[A-Z][A-Z]\d\d/.test(e.getAttribute('id')))) {
            await delayReal(Math.random()*1000*delayMul+delayBase);
            e.click();
            clickCount++;
        // console.log(e.nextElementSibling.outerText);
        } else {
            skipCount++;
        }
    }
    console.log('expansion finished.');
    console.log(clickCount, 'expansions executed.');
    console.log(skipCount, 'elements skipped.');
};
// })();
(async () => {
    await expandCurrent();
})(); // empty parentheses = Promise

const recursiveExpand = async () => {
    
}