# OSINT Automation Tool
 Backend for an OSINT Automation Tool built using Node.js and Python

## Required API Keys
- SERPAPI KEY
- RAPID API KEY
- TWILLIO TOKEN and SID
- X-RapidAPI-Key
- BITQUERY API KEY

## API Routes
- /test : to load the basic HTML page to see the working
- /get-user-data/:email_id : get user data for the email_id associated with google account
-  google-dork/cv/:first_name/:last_name ":"look for CV's of the target in public domain
- /google-dork/:username ":"look for account's with same user name across site's, people tend to use same username
- /google-dork/:site_name/:first_name/:last_name ":"look for their account on specific site name
- /get-loc-from-ip/:ip_addr ":"get location estimate using public IP address
- /get-loc-from-phone/:body ":"get location estimate using phone number, usage is 91XXXXXXXXXX
- /get-email-leak/:emailID ":"find what data associated with this email ID has been leaked and where
- /get-bitcoin-trans/:address ":"find transaction history of specific crypto wallet address
- /create-pdf ":"create a consolidated pdf of all generated data associated with this case. 

## Usage 
- Install Node.js
- Install required packages
- nodemon index.js
- localhost:5001/test
<img width="1512" alt="Screenshot 2024-03-13 at 12 53 43 PM" src="https://github.com/krishshah17/OSINT-Automation-Tool/assets/26605210/ea9d1251-6ac0-4585-b350-d115274963ae">

## Achievments
### Won 3rd Place at CIDEcode, a Hackathon organized by DSCI in association with Infosys, CCITR and PES University
