function DetectMeals(){
  var lastDate = getEpoch(getSpreadSheetValue(),25200000);
  var currentDate_input = Utilities.formatDate((new Date()), 'GMT-7', "MMMM dd, yyyy 'at' hh:mm a").toString();
  var currentDate = getEpoch(currentDate_input);   
  var currentHour = epochToDate(currentDate)[0];
  var currentMinute = epochToDate(currentDate)[1];
  var currentDayPart = epochToDate(currentDate)[2];
  var currentTime = currentHour+':'+currentMinute+' '+currentDayPart;
  var lastHour = epochToDate(lastDate,-25200000)[0];
  var lastMinute = epochToDate(lastDate,-25200000)[1];
  var lastDayPart = epochToDate(lastDate,-25200000)[2];
  var lastTime = lastHour+':'+lastMinute+' '+lastDayPart;

  var DebugTime = 'Last '+lastTime+' | Current: '+currentTime;

  var error = false;
  var errorState = '';
  var debug = 'Outside of reporting hours. ('+DebugTime+')';
  if (currentHour == 4 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'AM') {
    debug += 'A1: Success | ';
    if (lastHour == 4 && lastDayPart == 'AM') {
      error = false;
      errorState = 'Succes: 4AM meal was dispensed';
      debug += 'A1.A: Success ('+DebugTime+') | ';
    } else {
      error = true;
      errorState = '4AM meal was not dispensed';
      debug += 'A1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') ('+DebugTime+') | ';
    }
  }
  if (currentHour == 11 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'AM') {
    debug += 'B1: Success | ';
    if (lastHour == 11 && lastDayPart == 'AM') {
      error = false;
      errorState = 'Succes: 11AM meal was dispensed';
      debug += 'B1.A: Success ('+DebugTime+') | ';
    } else {
      error = true;
      errorState = '11AM meal was not dispensed';
      debug += 'BB1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') ('+DebugTime+') | ';
    }
  }
  if (currentHour == 5 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'PM') {
    debug += 'C1: Success | ';
    if (lastHour == 5 && lastDayPart == 'PM') {
      error = false;
      errorState = 'Succes: 5PM meal was dispensed';
      debug += 'C1.A: Success ('+DebugTime+') | ';
    } else {
      error = true;
      errorState = '5PM meal was not dispensed';
      debug += 'C1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') ('+DebugTime+') | ';
    }
  }

  errorReporting(error,errorState,debug,currentDate);
}

function getSpreadSheetValue(){
  var Avals = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Meals").getRange("A1:A").getValues();
  var extractDate = new RegExp("Automatic Meal Dispensed at (.+)", "gi");
  var filter = Avals.filter(String).length;
  var rowText = Avals[filter - 1][0];
  var lastDate = extractDate.exec(rowText)[1].toString();
  var lastDate = lastDate.replace('PM',' PM').replace('AM',' AM');
  return lastDate;
}

function errorReporting(error,errorState,debug,currentEpochTime){
  var myEmail = "put_your_email_here@email.com";
  var myTextEmail = "if_your_carrier_supports_email_to_Text_put_it_here@urCarrier.com";

  var d = new Date(currentEpochTime*1000);
  var currentTime = Utilities.formatDate(d, Session.getScriptTimeZone(), "hh:mm a").toString();
  var currentDate = Utilities.formatDate(d, Session.getScriptTimeZone(), "MMMM dd, yyyy").toString();
  
  // Initiate error reporting (Spreadsheet logging / Email Alerts)
  if (error){
    // Send e-mail
    MailApp.sendEmail({
      to: myEmail,
      subject: "Cat Meal Failed to Dispense",
      htmlBody: errorState + " (See more <a href='https://docs.google.com/spreadsheets/d/12XJ7PYLvlWFpb8Cs8yhW4lZ-NxmiUDKqt3Uu33WYlWI'>here</a>)"
    });
    // Send text notification
    MailApp.sendEmail({
      to: myTextEmail,
      subject: "",
      htmlBody: errorState
    });
    var emailQuotaRemaining = MailApp.getRemainingDailyQuota();
    
    // Log to spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Errors");
    sheet.appendRow([errorState+' (email Remaining '+emailQuotaRemaining+' )', currentDate,currentTime,debug]);
    sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).clearFormat();
    SpreadsheetApp.flush();
  } else {
/*  
    // Log to spreadsheet    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Success");
    sheet.appendRow(['Success', currentDate,currentTime,debug]);
    sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).clearFormat();
    SpreadsheetApp.flush();
*/
  }
}

function getEpoch(input,modifier){
  if (modifier == null) {
    modifier = 0;
  }
  var rG = new RegExp('(.+)\\s([0-9]{2}),\\s(20[0-9]{2})\\sat\\s([0-9]{2})\\:([0-9]{2})(.+)');
  var p = input.match(rG);
  var a = twelve24(p[4]+':'+p[5]+' '+p[6]);
  var b = parseInt(getMonth(p[1]));
  var c = p[3]+'-'+(b+1)+'-'+p[2]+'T'+a+':'+p[5]+':00Z';
  var io = (new Date(c).getTime()+modifier).toString();

  return io.substring(0,9);
}

function getMonth(month){
   return new Date(Date.parse(month +" 1, 2012")).getMonth();
}

function epochToDate(Epoch,modifier) {
  if (modifier == null){
    modifier = 0;
  }  
  var d = new Date(Number((Epoch*10000))+modifier);
  var time = Utilities.formatDate(d, 'GMT', "hh-mm-a").toString().split('-');
  return time;
}

function twelve24(input) {
  var time = input;
  var hours = time.match(/^(\d+)/)[1].toString();
  var minutes = Number(time.match(/:(\d+)/)[1]);
  var part = time.match(/\s+(.*)$/)[1].toString().toUpperCase();
  var toggle = false;

  if (part == "PM") {
    toggle = true;
    hours = Number(hours)+12
  } else {
    toggle = 'Route1';
    if (Number(hours) < 9 && hours.substring(0,1) !== "0") {
      toggle = 'Route2';
      hours = "0"+hours;
    }
  }
  return hours;
}
