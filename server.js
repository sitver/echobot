var restify = require('restify');
var builder = require('botbuilder');
var credentials = {
    accessKeyId: process.env.AWSACCESS,
    secretAccessKey: process.env.AWSSECRET,
    region: "us-east-1"
};
var dynasty = require('dynasty')(credentials),
    users = dynasty.table('easytee-users');
/// End of DB init

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
//Initial dialog.

bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/firstRun' }));
bot.dialog('/firstRun', [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
  

    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.userData.name = results.response;
        builder.Prompts.text(session, "What paypal account shall I pay when your shirt sells? (Give me the email address)");
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.userData.paypal = results.response;
       users.update({ hash: session.userData.paypal, range: session.userData.name }, {    optindate: new Date(), shirts: 0  });
      session.send("Very good! Let's make your first shirt");
        session.beginDialog('/');
    }
]);

// Shirt creator homepage
bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session,"Hey " + session.userData.name + "! What type of shirt do you want to design?", ["Quote tee", "Custom graphic tee", "Text Tee", "Explain these"]);
    },
      function (session, arg, next) {
        session.userData.design = arg.response.entity;
        if (session.userData.design === "Quote tee") {
            session.beginDialog('/quote');
        } else {
          session.send("That design is not yet available");
            next();
        }
    }
]);

// Dialog to create and preview a quote t-shirt.
bot.dialog('/quote', [
    function (session) {
        builder.Prompts.text(session, "What quote should be on your shirt?");
    },
  function (session, results) {
        session.userData.quote = results.response;
        builder.Prompts.text(session, "Who said it?"); 
    },
    function (session, results) {
        session.userData.author = results.response;
        builder.Prompts.choice(session, "What font do you want to use?", ["Arial", "Georgia", "Helvetica", "Times New Roman"]);
    },
      function (session, results) {
        session.userData.font = results.response.entity;
        builder.Prompts.choice(session, "What color should your shirt be?", ["Black", "Blue", "Red", "Green"]);
    },
    function (session, results) {
        session.userData.color = results.response.entity;
        session.send("Got it! Making your shirt...");
        // Build Shirt preview.
        // Deploy preview
        // Screenshot preview
        // Deploy screenshot
        // Send message with image preview.
        builder.Prompts.choice(session, "Is this right?", ["Yes", "No", "It's left"]);
        // Save shirt details (and user details) to database.
    },
  function (session, results) {
        console.log(results.response.entity);
        session.userData.yes = results.response.entity; 
        if (session.userData.yes === "Yes"){
                session.beginDialog('/details');

        }else{
      // Try again 
                session.beginDialog('/quote');
    }
    }
]);

// Dialog to figure out details for a shirt before selling.
bot.dialog('/details', [
        function (session) {
         builder.Prompts.text(session, "Name your shirt (i.e 'Freedom Quote T-shirt')")
    },
  function (session, results) {
        session.userData.title = results.response;
        builder.Prompts.choice(session, "Give it a price", ["$11.99 (Make $0)", "$14.99 (Make $3)", "$17.99 (Make $6)", "$19.99 (Make $9)","$21.99 (Make $11)"]); 
    },
    function (session, results) {
        session.userData.price = results.response.entity;
        session.send("Got it..." + session.Name  + session.userData.Name + " A " + session.userData.color + " shirt with the quote " + session.userData.quote + " by " + session.userData.author + " in font " + session.userData.font + ".");
   // Make shopify API call with details of shirt.
   // Make shopify API call to fetch link to shirt.
   // Send message with "Congratulations! Your shirt is on sale at LINK"
      // end conversation
      session.beginDialog('/');
    }
]);



// Dialog to upload graphics to shirt.
bot.dialog('/upload', [
    function (session) {
        builder.Prompts.attachment(session, "Upload a picture for me to make into a shirt.");
    },
  function (session, results) {
        session.userData.quote = results.response;
        builder.Prompts.text(session, "Who said it?"); 
    },
    function (session, results) {
        session.userData.author = results.response;
        builder.Prompts.choice(session, "What font do you want to use?", ["Arial", "Georgia", "Helvetica", "Times New Roman"]);
    },
      function (session, results) {
        session.userData.font = results.response.entity;
        builder.Prompts.choice(session, "What color should your shirt be?", ["Black", "Blue", "Red", "Green"]);
    },
    function (session, results) {
        session.userData.color = results.response.entity;
        session.send("Got it..." + session.userID + " A " + session.userData.color + " shirt with the quote " + session.userData.quote + " by " + session.userData.author + " in font " + session.userData.font + ".");
    }
]);

// Functions to save prompt data to DB and screenshot to DB.
// Functions to save prompt data to t-shirt template, screenshot, send screenshot to cdn (with unique id of shirt) and serve screenshot
// Function to send shirt data to shopify.
// Function to retrieve shirt link from shopify to send to user as message.



