//Future plans..
//Have a notification sent to user when an athan is announced.. (Maybe..)

//Quotes variables
var quotes = [];
var quoteAuthors = [];

//Get current date
var currentDate = new Date().toISOString().slice(0, 10);

//Get day (year,month,day)
var dateSplit = currentDate.split("-");
//data to feed into API
var city;
var country;
var day = dateSplit[2];
var month = dateSplit[1];
var year = dateSplit[0];
var apiCall;

//
const setup = document.getElementById('submit');

//To clear local storage.. 
// chrome.storage.local.clear(function(obj){
//     console.log("cleared");
//     });

//Check if city and country is saved.
chrome.storage.sync.get(["city", "country"], function (items) {
    var errorStatement = document.getElementById('error');

    if (items.city == undefined && items.country == undefined) {
        errorStatement.innerHTML = "Please select a country and city.";
    } else {
        //Show the current country and city selected
        document.getElementById('city').placeholder = items.city;
        document.getElementById('country').placeholder = items.country;

        //Country 
        city = items.city;
        //City
        country = items.country;
        //Update date and call API
        setTheDate();
        userAction();
    }

});

//This is to gain all the data like day, month, year, country, city. 
setup.addEventListener('click', () => {
    //Country
    city = document.getElementById('city').value;
    //City
    country = document.getElementById('country').value;
    //Error statement in P tag 
    var errorStatement = document.getElementById('error');
    //If user does not provide either city or country..
    if (city.length == 0 || country.length == 0) {
        errorStatement.innerHTML = "Please select a country and city.";
    } else {
        //save it to the local storage
        chrome.storage.sync.set({ "city": city, "country": country }, function () { });
        errorStatement.innerHTML = "";

        //The 2 functions needed
        setTheDate();
        userAction();
    }


});

//set the date
function setTheDate() {
    //Get day (year,month,day)
    dateSplit = currentDate.split("-");
    //data to feed into API
    var day = dateSplit[2];
    var month = dateSplit[1];
    var year = dateSplit[0];
    apiCall = 'http://api.aladhan.com/v1/calendarByCity?city=' + city + '&country=' + country + '&method=2&month=' + month + '&year=' + year;
}


//Get request 
var userAction = async () => {
    const response = await fetch(apiCall);
    const myJson = await response.json(); //extract JSON from the http response
    //Loop through all 5 athans
    // for (let i = 0; i < prayerAmt; i++) {
    // }

    var fajrPrayer = myJson.data[day - 1].timings['Fajr'];
    var dhuhrPrayer = myJson.data[day - 1].timings['Dhuhr'];
    var asrPrayer = myJson.data[day - 1].timings['Asr'];
    var maghribPrayer = myJson.data[day - 1].timings['Maghrib'];
    var ishaPrayer = myJson.data[day - 1].timings['Isha'];

    //converted times
    var slicedFajrPrayer = fajrPrayer.slice(0, 5);
    var slicedDhuhrPrayer = dhuhrPrayer.slice(0, 5);
    var slicedAsrPrayer = asrPrayer.slice(0, 5);
    var slicedMaghribPrayer = maghribPrayer.slice(0, 5);
    var slicedIshaPrayer = ishaPrayer.slice(0, 5);

    //Show them in popup
    document.getElementById('fajr').innerHTML = convertTime(slicedFajrPrayer);
    document.getElementById('dhuhr').innerHTML = convertTime(slicedDhuhrPrayer);
    document.getElementById('asr').innerHTML = convertTime(slicedAsrPrayer);
    document.getElementById('maghrib').innerHTML = convertTime(slicedMaghribPrayer);
    document.getElementById('isha').innerHTML = convertTime(slicedIshaPrayer);

    //Display time left for next prayer
    //List of athans so we can do calculations on it
    var athanList = [slicedFajrPrayer, slicedDhuhrPrayer, slicedAsrPrayer, slicedMaghribPrayer, slicedIshaPrayer];

    var today = new Date();
    var currentTime = today.getHours() + ":" + today.getMinutes();
    checkEndOfDay(slicedIshaPrayer, currentTime);
    //Calculate time difference
    calculateTimeDiff(athanList, currentTime.slice(0, 5));
}


//Obsolete so far (because I won't be moving onto the next day past Isha's prayers)
function checkEndOfDay(ishaTime, currentTime) {
    var firstTime = currentTime.split(':');
    var secondTime = ishaTime.split(':');
    //convert them into dates so we can let JS do the calculation for us.
    var d1 = new Date(0, 0, 0, firstTime[0], firstTime[1]),
        d2 = new Date(0, 0, 0, secondTime[0], secondTime[1]);
    //Check if we're at end of the day (by comparing the isha prayer)
    if (d1 > d2) {
        console.log("Isha time has passed.");
    }
}



//Calculate time difference
function calculateTimeDiff(athanList, currentTime) {
    //First find whats next prayer?
    //Current hour minus designated athan prayers hour (first, second, third.. etc)
    //Current minutes minus designated athan prayers minutes (first, second, third.. etc)

    //IF the hour difference is 1 hour, then just calculate minutes (i.e current time = 3 pm, athan is 4:30)
    var firstTime = currentTime.split(':');
    var ishaTime = athanList[athanList.length - 1];
    var fajrTime = athanList[0];

    console.log("current TIme " + currentTime);
    //Iterate through the athans 
    for (let i = 0; i < athanList.length; i++) {

        //Get the current Athan time (we slice to remove the 'PM or AM')
        var secondTime = athanList[i].split(':');

        //Create new date objects (so we can take difference between them)
        var d1 = new Date(), d2 = new Date();

        //D1 is current time and D2 is athan time
        d1.setHours(firstTime[0]);
        d1.setMinutes(firstTime[1]);
        d2.setHours(secondTime[0]);
        d2.setMinutes(secondTime[1]);

        //Find the difference
        var timeDiff = d2.getTime() - d1.getTime();
        // console.log(d1);
        // console.log(d2);

        //If the time diff is (+) it means athan has yet to pass.. so it's next one!
        if (timeDiff > 0) {
            //Convert the milliseconds to hours.. minutes and seconds
            //var nextAthan = new Date(timeDiff).toISOString().slice(11, 19);
            //Change the background of it to blue #d1e1f8
            changeBackgroundDiv(i);
            countDownTillNextPrayer(d2);
            break;
        }

        //Check if the last athan is come to pass (i.e calculate fajr for next day)
        //NEW: the problem of looping forever is because we don't compare days (we only compare time on same day)
        if (ishaTime < firstTime) {
            //move to next day
            //get Fajr of next day (Currently on Isha)
            d2.setDate(d2.getDate() + 1);
            //Recalculate
            //Find the difference
            timeDiff = d2.getTime() - d1.getTime();
        }
    }

}

//Highlights upcoming athan prayer background color to blue 
function changeBackgroundDiv(prayer) {
    switch (prayer) {
        case 0:
            document.getElementById('fajr').style.backgroundColor = "#d1e1f8";
            break;
        case 1:
            document.getElementById('dhuhr').style.backgroundColor = "#d1e1f8";
            break;
        case 2:
            document.getElementById('asr').style.backgroundColor = "#d1e1f8";
            break;
        case 3:
            document.getElementById('maghrib').style.backgroundColor = "#d1e1f8";
            break;
        case 4:
            document.getElementById('isha').style.backgroundColor = "#d1e1f8";
            break;
        default:
        // code block
    }
}

//Calculate time remaining for next athan.
function countDownTillNextPrayer(nextAthan) {
    setInterval(function () {
        const now = new Date().getTime();
        // Get today's date and time
        const timeDiff = nextAthan - now;
        var hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        document.getElementById("nextAthan").innerHTML = hours + ":" + minutes + ":" + seconds;
    }, 1000);
}


//Convert 24 hours to 12 (with AM and PM)
function convertTime(time) {
    //if it is 12 and above it is PM and minus it by 12 (except 12)
    var firstParsedTime = parseInt(time.slice(0, 3));
    //second part (i.e :23)
    var secondParsedTime = time.slice(2, 5);
    if (firstParsedTime > 12) {
        firstParsedTime -= 12;
        // return ((firstParsedTime < 10) ? '0'+firstParsedTime : firstParsedTime) +
        // secondParsedTime + ' PM';
        return firstParsedTime + secondParsedTime + ' PM';
    } else if (firstParsedTime == 12) {
        return firstParsedTime + secondParsedTime + ' PM';
    }
    else {
        return firstParsedTime + secondParsedTime + ' AM';
    }

}

//This is only loaded once (It's expensive doing it everytime..)
async function getQuote() {
    //Load text in quotes.txt
    const url = chrome.runtime.getURL('assets/quotes.txt');
    //Fetch it
    const resp = await fetch(url);
    const text = await resp.text();
    //array of all lines (of all quotes)
    const quoteLines = text.split('\n');
    //Manipulate text (separate it into each quote)
    //Basically a "pointer" pointing to beginning of quote (i.e at line 59... which is "32. The Prophet (PBUH)... ")
    var x = 0;
    //Empty word
    var currentWord = "";
    //go through each array (it's a lot we may have to serialize the array)
    for (let i = 0; i < quoteLines.length; i++) {
        //First letter
        const firstLetter = quoteLines[i][0];
        //if it starts with a # we begin our concatenation (basically we make sure it's a starting quote and not part of a quote i.e 23 ) XYZ.. )
        if (!isNaN(firstLetter) && firstLetter != ' ' && (quoteLines[i][1] == '.' || quoteLines[i][2] == '.' || quoteLines[i][3] == '.')) {

            //Authors
            if (i != 0) {

                //Get all lines from x (beginning of quote to currently)
                for (let y = x; y < i - 2;) {
                    currentWord += " " + quoteLines[y];
                    y++;
                }
                //Push quote and author to its respective arrays
                quotes.push(currentWord);
                quoteAuthors.push(quoteLines[i - 2]);
                //reset word
                currentWord = "";
            }

            //Save the location for the beginning of the quote 
            x = i;
        }
    }

    //Then save these!!
    chrome.storage.local.set({ "quoteList": quotes, "quoteListAuthors": quoteAuthors });

}

async function displayQuote() {
    //Get random #
    //const randomNum = Math.floor(Math.random() * 500);
    //Let's put a random quote each time..

    //Current quote of day (we will manipulate this every end of day after ISHA)
    chrome.storage.local.get(["currentQuoteNum"], function (items) {
        if (items.currentQuoteNum == undefined) {
            console.log("No quote is saved..");
            //Display quote in HTML... notice it's copy pasted twice.. Because for some odd reason currentQuoteNum becomes undefined outside this scope
            //Default Quote + Author
            document.getElementById('quote').innerHTML = quotes[0];
            document.getElementById('source').innerHTML = quoteAuthors[0];
        } else {
            console.log("quote is saved..!" + items.currentQuoteNum);
            document.getElementById('quote').innerHTML = quotes[items.currentQuoteNum];
            document.getElementById('source').innerHTML = quoteAuthors[items.currentQuoteNum];
        }
    });

}

//Generate random number and save it
function getRandomQuote() {
    //Save which quote to display!!
    const randomNum = Math.floor(Math.random() * 500);
    chrome.storage.local.set({ "currentQuoteNum": randomNum });
}

//We need async func because then displaying quotes wouldn't work (i.e display would execute first if we don't make it async)
async function determineToSave() {

    await getQuote();
    await displayQuote();

}


//Current day 
chrome.storage.local.get(["savedDate"], function (items) {
    //For first time.. if we dont have a date at all! Or it's new date! (i.e 2023-01-14 vs 2023-01-15)
    if (items.savedDate == undefined || items.savedDate != currentDate) {
        console.log("No current date is saved.." + currentDate);
        //Record down date and save it!
        chrome.storage.local.set({ "savedDate": currentDate });
        //If current date == saved date -> Don't do anything
        //If current date != saved date -> Generate random quote #, Save it and display the quote
        getRandomQuote();
    }
});

//save it to the local storage
//Check if the quotes exist in the local storage.. if so, awesome we don't need to run "getQuote"
chrome.storage.local.get(["quoteList", "quoteListAuthors"], function (items) {
    //If quotes arent saved.. then save it
    if ((items.quoteList == undefined && items.quoteListAuthors == undefined) || (items.quoteList.length == 0 && items.quoteListAuthors.length == 0)) {

        //Get a quote (async func)
        determineToSave();
        console.log("Uh oh quotes are not saved to your local storage");
    } else {
        //Otherwise we already have it saved!
        console.log("nice, quotes are saved!");
        quotes = items.quoteList;
        quoteAuthors = items.quoteListAuthors;
        displayQuote();
    }
});

