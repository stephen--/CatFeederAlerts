function DetectMeals() {
  myEmail = "put_your_email_here@email.com";
  myTextEmail = "if_your_carrier_supports_email_to_Text_put_it_here@urCarrier.com";

  // Address Sheet
  var Avals = SpreadsheetApp.getActiveSpreadsheet().getRange("A1:A").getValues();
  
  // Get Last Meal time
  var extractTime = new RegExp("([0-9]{1,2}\:[0-9]{2}(A|P)M)$", "gi");
  var extractDate = new RegExp("Automatic Meal Dispensed at (.+) at .+", "gi");
  var rowText = Avals[Avals.filter(String).length - 1][0];
  var lastTime = extractTime.exec(rowText)[1];
  var lastDate = extractDate.exec(rowText)[1];

  // Get current time
  var d = new Date();
  var currentTime = Utilities.formatDate(d, 'America/Los_Angeles', 'h:ss a');
  var currentDate = Utilities.formatDate(d, 'America/Los_Angeles', 'MMMM dd, yyyy');

  //Check if most recent entry is in today's date
  var meal1 = new RegExp('(4)\:4[0-9] AM','gi');
  var meal2 = new RegExp('(11)\:4[0-9] AM','gi');
  var meal3 = new RegExp('(5)\:4[0-9] PM','gi');
  var timeMargin = new RegExp('[1-3]\:[0-9]{1,2} AM','gi');
  var proceedWithMealCheck = false;
  var reportError = false;
  var errorState = false;

  Logger.log('lastTime: '+lastTime);
  Logger.log('currentTime: '+currentTime);
  Logger.log('lastDate: '+lastDate);
  Logger.log('currentDate: '+currentDate);
  
  if (currentDate == lastDate){
    if(!currentTime.match(timeMargin)) {
      proceedWithMealCheck = true;
    } else {
      Logger.log('Current time outside acceptable margin');
    } 
  } else {
    reportError = true;
    errorState = 'Log entries were not found for today\'s date ('+ currentDate +')';
    Logger.log('currentDate: "'+currentDate+'" lastDate: "'+lastDate+'"');
  }
  
  if (proceedWithMealCheck) {
    if (currentTime.match(meal2) && !lastTime.match(meal1)) { // Check for 4:29AM Meal Log Entry
      reportError = true;
      errorState = '4:29AM Meal was not dispensed on' + currentDate;
    }
    if (currentTime.match(meal2) && !lastTime.match(meal2)) { // Check for 11:29AM Meal Log Entry
      reportError = true;
      errorState = '4:29AM & 11:29AM Meals were not dispensed on ' + currentDate;
    }
    if (currentTime.match(meal3) && !lastTime.match(meal3)) { // Check for 5:29PM Meal Log Entry
      reportError = true;
      errorState = 'Meals were not dispensed on ' + currentDate;
    }
  }

  // Initiate error reporting (Spreadsheet logging / Email Alerts)
  if (reportError){
    // Log to spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Errors");
    sheet.appendRow([errorState, currentDate,currentTime]);
    sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).clearFormat();
    SpreadsheetApp.flush();
    
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
  } else {
    Logger.log('Success');
  }
}
