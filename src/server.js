require("dotenv").config();
const express = require("express");
const { NCCOBuilder, Talk, Connect } = require("@vonage/voice");
const { verifySignature } = require("@vonage/jwt");

// Create Express app
const app = express();

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const verifyJWT = (req) => {
 // Verify if the incoming message came from Vonage
 const jwtToken = req.headers.authorization.split(" ")[1];
 if (!verifySignature(jwtToken, process.env.VONAGE_API_SIGNATURE_SECRET)) {
   console.error("Unauthorized request");
   throw new Error("Not a messages API request");
 }

 console.log("JWT verified");
};

// Endpoint to handle inbound calls
app.all("/answer", (req, res) => {
 console.log("Received inbound call...");

 verifyJWT(req);

 // Build the NCCO for handling the call
 const builder = new NCCOBuilder();

 // Add the Talk action to greet the caller
 builder.addAction(
   new Talk("Hello, this is a test call. The call will be forwarded shortly.")
 );

 // Add the Connect action to forward the call to another number
 builder.addAction(
   new Connect(
     {
       type: "phone",
       number: process.env.SECOND_PHONE_NUMBER,
     },
     process.env.VONAGE_VIRTUAL_NUMBER
   )
 );

 let ncco = builder.build(); // Build the NCCO

 // Respond with the NCCO to control the call
 res.json(ncco);
});

// Handle Vonage Call Events
app.all("/webhooks/event", (req, res) => {
 console.log("Received Event:", req.body);

 const { status } = req.body;

 if (status === "rejected") {
   console.error("Call rejected. Check error code and message.");
 }

 // Ensure response is in JSON format
 res.status(200).json({ success: true }); // This should be a valid JSON response
});

// Listen on port 3000
app.listen(3000, () => {
 console.log("App listening on port 3000");
});
