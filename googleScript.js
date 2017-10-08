function DetectMeals(){
  var lastDate = getEpoch(getSpreadSheetValue());
  var d = new Date();
  var currentDate = getEpoch(Utilities.formatDate(d, 'America/Los_Angeles', "MMMM dd, yyyy 'at' hh:mm a").toString());
  var currentHour = epochToDate(currentDate)[0];
  var currentMinute = epochToDate(currentDate)[1];
  var currentDayPart = epochToDate(currentDate)[2];
  var lastHour = epochToDate(lastDate)[0];
  var lastMinute = epochToDate(lastDate)[1];
  var lastDayPart = epochToDate(lastDate)[2];
  
  var error = false;
  var errorState = '';
  var debug = 'Outside of reporting hours.';
  if (currentHour == 4 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'AM') {
    debug += 'A1: Success | ';
    if (lastHour == 4 && lastDayPart == 'AM') {
      error = false;
      errorState = 'Succes: 4AM meal was dispensed';
      debug += 'A1.A: Success| ';
    } else {
      error = true;
      errorState = '4AM meal was not dispensed';
      debug += 'A1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') | ';
    }
  }
  if (currentHour == 11 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'AM') {
    debug += 'B1: Success | ';
    if (lastHour == 11 && lastDayPart == 'AM') {
      error = false;
      errorState = 'Succes: 11AM meal was dispensed';
      debug += 'B1.A: Success| ';
    } else {
      error = true;
      errorState = '11AM meal was not dispensed';
      debug += 'BB1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') | ';
    }
  }
  if (currentHour == 5 && currentMinute >= 29 && currentMinute <= 59 && currentDayPart == 'PM') {
    debug += 'C1: Success | ';
    if (lastHour == 5 && lastDayPart == 'PM') {
      error = false;
      errorState = 'Succes: 5PM meal was dispensed';
      debug += 'C1.A: Success| ';
    } else {
      error = true;
      errorState = '5PM meal was not dispensed';
      debug += 'C1.B: Failed (Last Hour: '+lastHour+' AM/PM '+lastDayPart+') | ';
    }
  }

  errorReporting(error,errorState,debug,currentDate);

  Logger.log('     ================================');
  Logger.log('     Error:            ' +error);
  Logger.log('     ErrorState:    '+errorState);
  Logger.log('     Debug:          ' +debug);
  Logger.log('     ================================');
  Logger.log('     currentDate: '+currentDate);
  Logger.log('     lastDate:       '+lastDate);
  Logger.log('     ================================');
  Logger.log('     cD Array:      '+epochToDate(currentDate));
  Logger.log('     lD Array:       '+epochToDate(lastDate));
  Logger.log('     ================================');
}

function getSpreadSheetValue(){
  var Avals = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Meals").getRange("A1:A").getValues();
  var extractDate = new RegExp("Automatic Meal Dispensed at (.+)", "gi");
  var filter = Avals.filter(String).length;
  var rowText = Avals[filter - 1][0];
  var lastDate = extractDate.exec(rowText)[1].toString();
  return lastDate;
}

function errorReporting(error,errorState,debug,currentEpochTime){
  var myEmail = "put_your_email_here@email.com";
  var myTextEmail = "if_your_carrier_supports_email_to_Text_put_it_here@urCarrier.com

  var d = new Date(currentEpochTime*1000);
  var currentTime = Utilities.formatDate(d, 'America/Los_Angeles', "hh:mm a").toString();
  var currentDate = Utilities.formatDate(d, 'America/Los_Angeles', "MMMM dd, yyyy").toString();

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
    Logger.log("Remaining email quota: " + emailQuotaRemaining);
    Logger.log('Appended error to "Errors" sheet.');
    Logger.log(errorState);
    
    // Log to spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Errors");
    sheet.appendRow([errorState+' (email Remaining '+emailQuotaRemaining+' )', currentDate,currentTime,debug]);
    sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).clearFormat();
    SpreadsheetApp.flush();
  } else {
    if (currentTime.indexOf("AM")>-1) {
      currentTime = currentTime.replace('AM','PM');
    } else {
      currentTime = currentTime.replace('PM','AM');
    }
  
    // Log to spreadsheet    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Success");
    sheet.appendRow(['Success', currentDate,currentTime,debug]);
    sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).clearFormat();
    SpreadsheetApp.flush();
  }
}

function getEpoch(input){
  var rG = new RegExp('(.+)\\s([0-9]{2}),\\s(20[0-9]{2})\\sat\\s([0-9]{2})\\:([0-9]{2})(.+)');
  var p = input.match(rG);
  var a = twelve24(p[4]+':'+p[5]+' '+p[6]);
  var b = parseInt(getMonth(p[1]));
  var io = (new Date(+p[3],+b,+p[2],+a,+p[5]).getTime() / 1000).toString();
  return io;
}

function getMonth(month){
   return new Date(Date.parse(month +" 1, 2012")).getMonth();
}

function epochToDate(Epoch) {
//  var d = Date(Epoch * 1000);
  var d = new Date(Epoch * 1000);
  var time = new Array(2);
      time[0] = Utilities.formatDate(d, 'America/Los_Angeles', "hh").toString();
      time[1] = Utilities.formatDate(d, 'America/Los_Angeles', "mm").toString();
      time[2] = Utilities.formatDate(d, 'America/Los_Angeles', "a").toString();
  if (time[2] == 'AM'){
    time[2]='PM';
  }else{
    time[2]='AM';
  }
  return time;
}

function twelve24(input) {
  var time = input;
  var hours = Number(time.match(/^(\d+)/)[1]);
  var minutes = Number(time.match(/:(\d+)/)[1]);
  var AMPM = time.match(/(.*)$/)[1].toLowerCase();
  
  if (AMPM == "pm" && hours < 12) hours = hours + 12;
  if (AMPM == "am" && hours == 12) hours = hours - 12;
  var sHours = hours.toString();
  var sMinutes = minutes.toString();
  if (hours < 10) sHours = "0" + sHours;
  if (minutes < 10) sMinutes = "0" + sMinutes;
  return sHours;
}
