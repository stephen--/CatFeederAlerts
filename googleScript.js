function myFunction() {
  yourEmail = "PutYour@Email.Here" /* Put your normal email address here (e.g., bob@gmail.com) */
  yourTextEmail = "PutYourPhone@Email.Here" /* If your cell phone provider supports email-to-text forward, put your carrier email here */

  // Get current time
  var d = new Date();
  var currentTime = d.toLocaleTimeString();
  var currentDate = Utilities.formatDate(d, 'America/Los_Angeles', 'MMMM dd, yyyy');

  // Address Sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Sheet1'))
  var Avals = ss.getRange("A1:A").getValues();
  var filtered_r = Avals.filter(String).length;
  
  // Get Last Entry's time
  var rowText = Avals[filtered_r - 1][0];
  var regExp = new RegExp("([0-9]{1,2}\:[0-9]{2})(A|P)M$", "gi");
  var lastTime = regExp.exec(rowText)[1];
  var regExp = new RegExp("Automatic Meal Dispensed at (.+) at .+", "gi");
  var lastDate = regExp.exec(rowText)[1];

  //Check if most recent entry is in today's date
  var reportError = false;
  var errorState = false;
  if (currentDate == lastDate) {
  
    // Check for 4:29AM Meal
    var regExp = new RegExp('(4)\:[0-9]{1,2}\:[0-9]{1,2} AM PDT','gi');
    if (currentTime.match(regExp)) {
      if (lastTime == currentTime){
        reportError = false;
      } else {
        reportError = true;
        errorState = '4:29AM Meal was not dispensed';    
      }
    }
    
    // Check for 11:29AM Meal
    var regExp = new RegExp('(11)\:[0-9]{1,2}\:[0-9]{1,2} AM PDT','gi');
    if (currentTime.match(regExp)) {
      if (lastTime == currentTime){
        reportError = false;
        Logger.log('lastTime == currentTime');
      } else {
        reportError = true;
        errorState = '4:29AM & 11:29AM Meals were not dispensed on ' + currentDate;
      }
    }
    
    // Check for 5:29PM Meal
    var regExp = new RegExp('(5)\:[0-9]{1,2}\:[0-9]{1,2} PM PDT','gi');
    if (currentTime.match(regExp)) {
      if (lastTime == currentTime){
        reportError = false;
        Logger.log('lastTime == currentTime');
      } else {
        reportError = true;
        errorState = 'Meals were not dispensed on ' + currentDate;
      }
    }
    
/*
    // Debugging Statement
    // Set to current Hour----V
    var regExp = new RegExp('(7)\:[0-9]{1,2}\:[0-9]{1,2} PM PDT','gi');
    if (currentTime.match(regExp)) {
      if (lastTime == currentTime){
        reportError = false;
        Logger.log('lastTime == currentTime');
      } else {
        reportError = true;
        errorState = 'Debug meals were not dispensed on ' + currentDate;
      }
    }
*/    
  } else {
    reportError = true;
    errorState = 'Log entries were not found for today\'s date ('+ currentDate +')';
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
      to: yourEmail,
      subject: "Cat Meal Failed to Dispense",
      htmlBody: errorState + " (See more <a href='https://docs.google.com/spreadsheets/d/12XJ7PYLvlWFpb8Cs8yhW4lZ-NxmiUDKqt3Uu33WYlWI'>here</a>)"
    });
    // Send text notification
    MailApp.sendEmail({
      to: yourTextEmail,
      subject: "",
      htmlBody: errorState
    });
    
    var emailQuotaRemaining = MailApp.getRemainingDailyQuota();
    Logger.log("Remaining email quota: " + emailQuotaRemaining);
    
    Logger.log('Appended error to "Errors" sheet.');
  } else {
    Logger.log('reportError: '+reportError);
    Logger.log('errorState: '+errorState);
  }
}
