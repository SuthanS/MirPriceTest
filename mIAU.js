const puppeteer = require ('puppeteer'); // Uses puppeteer package to use chromium broswer to scrape data
const https = require('https'); // to post to telegram api
var emoji = require('node-emoji') // Allows use of emoji

const TelegramBot = require('node-telegram-bot-api');
const token = '1518781137:AAEgZo45N2JOw0WACM5KYGV8KB-mZSV12zc';
const bot = new TelegramBot(token, {polling: false});
const chatId = '@secretTestMir';
//const chatId = '@secrettedtingsite';

// dictionary with token pairs
const tokePairDict = {
    'uluna': 'LUNA',
    'UST':'UST',
    'ukrw': 'KRT',
    'usdr':'SDT',
    'umnt': 'MNT',
    'terra15gwkyepfc6xgca5t5zefzwy42uts8l2m4g40k6':'MIR',
    'terra1vxtwu4ehgzz77mnfwrntyrmgl64qjs75mpwqaz': 'mAAPL',
    'terra1h8arz2k547uvmpxctuwush3jzc8fun4s96qgwt':'mGOOGL',
    'terra14y5affaarufk3uscy2vr6pe6w6zqf2wpjzn5sh':'mTSLA',
    'terra1jsxngqasf2zynj5kyh0tgq9mj3zksa5gk35j4k':'mNFLX',
    'terra1csk6tc7pdmpr782w527hwhez6gfv632tyf72cp':'mQQQ',
    'terra1cc3enj9qgchlrj34cnzhwuclc4vl2z3jl7tkqg':'mTWTR',
    'terra1227ppwxxj3jxz8cfgq00jgnxqcny7ryenvkwj6':'mMSFT',
    'terra165nd2qmrtszehcfrntlplzern7zl4ahtlhd5t2':'mAMZN',
    'terra1w7zgkcyt7y4zpct9dw8mw362ywvdlydnum2awa':'mBABA',
    'terra15hp9pr8y4qsvqvxf3m4xeptlk7l8h60634gqec':'mIAU',
    'terra1kscs6uhrqwy6rx5kuw5lwpuqvm3t6j2d6uf2lp':'mSLV',
    'terra1lvmx8fsagy70tv0fhmfzdw9h6s3sy4prz38ugf':'mUSO',
    'terra1zp3a6q6q4953cz376906g5qfmxnlg77hx3te45':'mVIXY',

  };

//(MSFT pair)
lcdUrl = 'https://lcd.terra.dev/txs?execute_contract.contract_address='
mMSFT = 'terra1227ppwxxj3jxz8cfgq00jgnxqcny7ryenvkwj6'
mAPPL = 'terra1vxtwu4ehgzz77mnfwrntyrmgl64qjs75mpwqaz'
mGOOGL = 'terra1h8arz2k547uvmpxctuwush3jzc8fun4s96qgwt'
mTSLA = 'terra14y5affaarufk3uscy2vr6pe6w6zqf2wpjzn5sh'
mNFLX = 'terra1jsxngqasf2zynj5kyh0tgq9mj3zksa5gk35j4k'
mQQQ = 'terra1csk6tc7pdmpr782w527hwhez6gfv632tyf72cp'
mTWTR = 'terra1cc3enj9qgchlrj34cnzhwuclc4vl2z3jl7tkqg'
mAMZN = 'terra165nd2qmrtszehcfrntlplzern7zl4ahtlhd5t2'
mBABA = 'terra1w7zgkcyt7y4zpct9dw8mw362ywvdlydnum2awa'
mIAU = 'terra15hp9pr8y4qsvqvxf3m4xeptlk7l8h60634gqec'
mSLV = 'terra1kscs6uhrqwy6rx5kuw5lwpuqvm3t6j2d6uf2lp'
mUSO = 'terra1lvmx8fsagy70tv0fhmfzdw9h6s3sy4prz38ugf'
mVIXY = 'terra1zp3a6q6q4953cz376906g5qfmxnlg77hx3te45'
terraFinderTX = 'https://finder.terra.money/columbus-4/tx/'

function commaNumberFormat(n) {
    return n.replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
  }

// emojis for red alert and bear/bull 
const bear = emoji.get('bear');
const bull = emoji.get('ox');
const redAlert = emoji.get('rotating_light');

// function for how many red alerts to display
function redAlertLevel (num){
    if (num < 5000) {
        return('')
    } else if (num >= 5000 && num < 10000 ) {
        return(redAlert)
    } else if (num >= 10000 && num < 50000 ) {
        return(redAlert + redAlert) 
    } else if (num >=50000 && num < 100000 ) {
        return(redAlert + redAlert + redAlert)
    } else if (num >= 100000){
        return(redAlert + redAlert + redAlert + redAlert)
    } 
}  

async function grabTerraMoneyData(txHash) {
    const browser2 = await puppeteer.launch();

    url = 'https://finder.terra.money/columbus-4/tx/'
    // Pass txHash to web page
    const page2 = await browser2.newPage();
    try {
        await page2.goto(url + txHash, {waitUntil: 'load', timeout: 0});
    
        // Grabs list of all the pages transaction details
        // Use this to find out if its a buy, sell, add liquidity, remove liquidity etc
        let actionTypes = await page2.evaluate(() => Array.from(document.querySelectorAll('.Msg_attrValue__3xnn3'), element => element.textContent));

        if (actionTypes.length == 0) {
            const page3 = await browser2.newPage();
            await page3.goto(url + txHash, {waitUntil: 'load', timeout: 0});
            actionTypes = await page3.evaluate(() => Array.from(document.querySelectorAll('.Msg_attrValue__3xnn3'), element => element.textContent));
        }
        

        //console.log(url + txHash)

        console.log('action types: ', actionTypes);

        // *Buy* includes a swap and transfer
        if (actionTypes.includes('swap') && actionTypes.includes('transfer') ) {
            console.log('triggered buy')
            // Grab offer asset 
            const [el] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[3]/td');
            const txt = await el.getProperty('textContent');
            const offerAsset = await txt.jsonValue();

            // Grab offer amount
            const [el1] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[5]/td');
            const offerTxt = await el1.getProperty('textContent');
            let offerAmount = await offerTxt.jsonValue();

            // Grab return amount
            const [el2] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[6]/td');
            const returnTxt = await el2.getProperty('textContent');
            let returnAmount = await returnTxt.jsonValue();

            // Grab ask asset
            const [el3] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[4]/td/div/img');
            const askTxt = await el3.getProperty('alt');
            const askAsset = await askTxt.jsonValue();
            
            console.log(`Bought ${returnAmount} ${Stock} for $${offerAmount} UST`)

            await page2.close()
            await browser2.close()

            // Convert numbers from string format to float
            offerAmount = parseFloat(offerAmount.replace(/,/g, '')).toFixed(2)
            returnAmount = parseFloat(returnAmount.replace(/,/g, '')).toFixed(2)


            console.log(offerAmount);
            if (parseInt(offerAmount) < 100) {return(false)}
            
            const alerts = redAlertLevel(parseInt(offerAmount))

            const price = offerAmount / returnAmount

            return (`${bull}${alerts} Bought <b>${commaNumberFormat(returnAmount)}</b> #${Stock} for <b>$${commaNumberFormat(offerAmount)}</b> ${tokePairDict[offerAsset]} @ $${commaNumberFormat(price.toFixed(2))}`)

        }
        
        // *Sell* 
        else if (actionTypes.includes('send') && actionTypes.includes('swap') ) {
            // Grab offer asset 
            const [el] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[8]/td/div/a');
            const txt = await el.getProperty('textContent');
            const offerAsset = await txt.jsonValue();

            // Grab offer amount
            const [el1] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[10]/td');
            const offerTxt = await el1.getProperty('textContent');
            let offerAmount = await offerTxt.jsonValue();

            // Grab return amount
            const [el2] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[11]/td');
            const returnTxt = await el2.getProperty('textContent');
            let returnAmount = await returnTxt.jsonValue();

            // Grab ask asset
            const [el3] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[9]/td');
            const askTxt = await el3.getProperty('textContent');
            const askAsset = await askTxt.jsonValue();
            
            console.log(`Sold ${offerAmount} ${Stock} for $${returnAmount} UST`)

            await page2.close();
            await page3.close();
            await browser2.close(); 

            // Convert numbers from string format to float
            offerAmount = parseFloat(offerAmount.replace(/,/g, '')).toFixed(2)
            returnAmount = parseFloat(returnAmount.replace(/,/g, '')).toFixed(2)

            if (parseInt(offerAmount) < 100) {return(false)}

            const alerts = redAlertLevel(parseInt(returnAmount))

            const price = parseFloat(returnAmount.replace(/,/g, '')) / parseFloat(offerAmount.replace(/,/g, '')) 

            return (`${bear}${alerts} Sold <b>${commaNumberFormat(offerAmount)}</b> #${Stock} for <b>$${commaNumberFormat(returnAmount)}</b> ${tokePairDict[askAsset]} @ $${commaNumberFormat(price.toFixed(2))}`)

        }

        
        // Provide Liquidity
        else if (actionTypes.includes('provide_liquidity') && actionTypes.includes('mint') ) {
            // Grab offer asset and amounts 
            const [el] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div[2]/div[2]/section[2]/table/tbody/tr[3]/td');
            const txt = await el.getProperty('textContent');
            let Assets = await txt.jsonValue();
            Assets = Assets.replace(/\n/g," ");
            let assetsArr = Assets.split(' ');

            // Grab return amount
            const [el2] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div[2]/div[2]/section[2]/table/tbody/tr[14]/td');
            const returnTxt = await el2.getProperty('textContent');
            let returnAmount = await returnTxt.jsonValue();
            
            console.log('provided: ', Assets, 'recieved LP: ', returnAmount)

            await page2.close()
            await browser2.close(); 

            // Convert numbers from string format to float
            assetsArr[0] = parseFloat(assetsArr[0].replace(/,/g, '')).toFixed(2)
            assetsArr[2] = parseFloat(assetsArr[2].replace(/,/g, '')).toFixed(2)
            returnAmount = parseFloat(returnAmount.replace(/,/g, '')).toFixed(2)

            if (parseInt(assetsArr[2]) < 100) {return(false)}

            const alerts = redAlertLevel(parseInt(assetsArr[2]))

            const price = parseFloat(assetsArr[2].replace(/,/g, '')) / parseFloat(assetsArr[0].replace(/,/g, ''))

            return (`${bull}${alerts} Provided Liquidity <b>${commaNumberFormat(assetsArr[0])}</b> #${assetsArr[1]} and <b>$${commaNumberFormat(assetsArr[2])}</b> ${assetsArr[3]} for ${returnAmount} LP Tokens @ $${commaNumberFormat(price.toFixed(2))}`)

        } 

        
        // Remove Liquidity
        else if (actionTypes.includes('send') && actionTypes.includes('withdraw_liquidity') ) {
            // Grab offer asset and amounts 
            const [el] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[9]/td');
            const txt = await el.getProperty('textContent');
            let Assets = await txt.jsonValue();
            Assets = Assets.replace(/\n/g," ");
            let assetsArr = Assets.split(' ');

            // Grab withdrawn amount
            const [el2] = await page2.$x('//*[@id="root"]/section/section/div/div[9]/div[2]/div/div[2]/section[2]/table/tbody/tr[8]/td');
            const withdrawnTxt = await el2.getProperty('textContent');
            let withdrawn = await withdrawnTxt.jsonValue();
            
            console.log('LP Returned/Burned: ', withdrawn, 'Assets returned ', Assets)

            await page2.close()
            await browser2.close(); 

            // Convert numbers from string format to float
            assetsArr[0] = parseFloat(assetsArr[0].replace(/,/g, '')).toFixed(2)
            assetsArr[2] = parseFloat(assetsArr[2].replace(/,/g, '')).toFixed(2)
            withdrawn = parseFloat(withdrawn.replace(/,/g, '')).toFixed(2)

            if (parseInt(assetsArr[0]) < 100) {return(false)}

            const alerts = redAlertLevel(parseInt(assetsArr[0]))

            const price = parseFloat(assetsArr[0].replace(/,/g, '')) / parseFloat(assetsArr[2].replace(/,/g, ''))

            return (`${bear}${alerts} Withdrew Liquidity ${withdrawn} LP Tokens for <b>$${commaNumberFormat(assetsArr[0])}</b> ${assetsArr[1]} and <b>${commaNumberFormat(assetsArr[2])}</b> #${assetsArr[3]} @ $${commaNumberFormat(price.toFixed(2))}`)

        }

        
        //console.log(el)

}   catch(err) {
        await browser2.close();  
        console.log('error!', err)
    }
        await browser2.close(); 
        return(false)
    
}



// last page that was accessed by the scraper
let lastLoggedPage;
let currPage;

// Stores live log current pages transaction hashes
let lastLoggedTxHashes = [];

// Stores last captured amount of transactions
let lastLoggedTotalTransactions;
let currTotalTransactions;

// First time running var 
let firstTimeRunning = true;

// Current Stock
Stock = 'mIAU' // change based on which stock we are tracking

//---------------------------------------------------------
async function liveScrape(url) {
    currUrl = url;
    console.log('last logged page: ', lastLoggedPage);
    console.log('last logged total transactions: ', lastLoggedTotalTransactions);

    

    async function grabLcdData(url) {
        // creates browser
        const browser1 = await puppeteer.launch();
        try {
            const page1 = await browser1.newPage();
            await page1.goto(url, {waitUntil: 'load', timeout: 30000});
        
        const [el0] = await page1.$x('/html/body/pre');
        const txt = await el0.getProperty('textContent');
        const rawTxt = await txt.jsonValue();
        
        // convert raw text into JSON data
        let data = JSON.parse(rawTxt);
        //console.log(data)

        await page1.close()
        
        currPage = (data.page_total);
        console.log("Current Page: ", currPage)

        currTotalTransactions = (data.total_count);
        console.log("Current Transactions: ", currTotalTransactions)


        const page2 = await browser1.newPage();
        await page2.goto(url + '&page=' + currPage, {waitUntil: 'load', timeout: 0});

        const [el1] = await page2.$x('/html/body/pre');
        const txt1 = await el1.getProperty('textContent');
        const rawTxt1 = await txt1.jsonValue();
        
        // convert raw text into JSON data
        data = JSON.parse(rawTxt1);
    
        await page2.close()
        await browser1.close() // close the browser

        return (data);

    }   catch(err) {
            await browser1.close(); 
            console.log('error!', err)
            throw 'error, restart!';   
        }
        
    }

    // get the raw data
    data = await grabLcdData(url);

    

    let newTransactionHashes = [] 
    if (currPage == lastLoggedPage && lastLoggedTotalTransactions !== currTotalTransactions){ 
        for (tx of data.txs) {
            if (lastLoggedTxHashes.includes(tx.txhash) == false){
                newTransactionHashes.push(tx.txhash)
            } 
        }
        
        // push difference(new transaction) to telegram API by calling txclshash on terra finder to sort by action type
        console.log('New Transactions: ', newTransactionHashes.length)
        if (newTransactionHashes.length != 0) {
        for (txhash of newTransactionHashes) {
            const action = await grabTerraMoneyData(txhash)
            console.log(txhash);
            console.log("action: ", action, '\n')
            if (action !== false) {
             // push to TG
             console.log('Pushing to tg')
             bot.sendMessage(chatId, `${action} \n<a href='${terraFinderTX+txhash}'>Terra Finder | ${txhash.substring(0, 5)}...</a>`, {parse_mode : "HTML"});     
            }
        }
            }
        
        
        // Make curr transaction list the now equal to all on the page only if there was a new transaction added
        if (newTransactionHashes.length !== 0) { lastLoggedTxHashes.push(...newTransactionHashes)}


    } else if (currPage != lastLoggedPage) {
        // New page
        console.log("New page", currPage)
        for (tx of data.txs) {
            newTransactionHashes.push(tx.txhash) 
        }

        // Clear old Transaction Log and push new transactions to log
        lastLoggedTxHashes = [...newTransactionHashes]

        if (firsTimeRunning = true) {
            firstTimeRunning = false;
            
            // Make curr live page to now last logged page
            lastLoggedPage = currPage;

            // Make curr total transactions to now last total transactions
            lastLoggedTotalTransactions = currTotalTransactions;
            console.log('First time skip', lastLoggedTxHashes)
            return;
        }

        // push difference(new transaction) to telegram API by calling txhash on terra finder to sort by action type
        console.log('transactions from new page', newTransactionHashes)
        for (txhash of newTransactionHashes) {
            const action = await grabTerraMoneyData(txhash)
            console.log(txhash);
            console.log("action: ", action,'\n')
            if (action !== false) {
                // push to TG
                bot.sendMessage(chatId, `${action} \n<a href='${terraFinderTX+txhash}'>Terra Finder | ${txhash.substring(0, 5)}...</a>`, {parse_mode : "HTML"});     
            }
        }
    }

    // Make curr live page to now last logged page
    lastLoggedPage = currPage;

    // Make curr total transactions to now last total transactions
    lastLoggedTotalTransactions = currTotalTransactions;

    console.log('end\n')
}



// Start running liveScrape job
function run() {
    liveScrape(lcdUrl + mIAU).then(run).catch(run) // change to stock name
}

run()



