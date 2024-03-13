const http = require("http");
const express = require('express');
const qs = require("querystring");
const url = require("url");
const cors=require("cors")
const reqs=require("request")
const bodyParser = require("body-parser");
const { exec } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const SerpApi = require("google-search-results-nodejs")
const search = new SerpApi.GoogleSearch("ENTER SERPAPI KEY")
const rapid_api_key='ENTER RAPID API KEY'
const uuid = require('uuid-v4');
const accountSid = 'ENTER TWILLIO SID';
const authToken = 'ENTER TWILLIO TOKEN';
const client = require('twilio')(accountSid, authToken);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let jsonFile = require('jsonfile');
const query = `
query ($network: BitcoinNetwork!, $address: String!, $inboundDepth: Int!, $outboundDepth: Int!, $limit: Int!, $from: ISO8601DateTime, $till: ISO8601DateTime) {
  bitcoin(network: $network) {
    inbound: coinpath(
      initialAddress: {is: $address}
      depth: {lteq: $inboundDepth}
      options: {direction: inbound, asc: "depth", desc: "amount", limitBy: {each: "depth", limit: $limit}}
      date: {since: $from, till: $till}
    ) {
      sender {
        address
        annotation
      }
      receiver {
        address
        annotation
      }
      amount
      depth
      count
    }
    outbound: coinpath(
      initialAddress: {is: $address}
      depth: {lteq: $outboundDepth}
      options: {asc: "depth", desc: "amount", limitBy: {each: "depth", limit: $limit}}
      date: {since: $from, till: $till}
    ) {
      sender {
        address
        annotation
      }
      receiver {
        address
        annotation
      }
      amount
      depth
      count
    }
  }
}
`;

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

function createPDF(filePath, jsonData, jsonFileArr) {
    const doc = new PDFDocument();
    const pdfStream = fs.createWriteStream(filePath);

    doc.pipe(pdfStream);

    // Add JSON data to PDF
    jsonData.forEach((data, index) => {
        doc.fontSize(16).text(`JSON Data from ${jsonFileArr[index]}`, { align: 'center' }).moveDown();
        doc.fontSize(12).text(JSON.stringify(data, null, 2)).moveDown();
    });

    doc.end();
}

// Function to read all JSON files in a directory
function readJSONFilesInDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.filter(file => file.endsWith('.json')).map(file => path.join(directoryPath, file));
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}

// Main function to read JSON files, parse data, and create a single PDF file
function processJSONFiles(directoryPath, outputPath) {
    const jsonFiles = readJSONFilesInDirectory(directoryPath);
    const jsonData = [];
    const jsonFileArr = [];
    jsonFiles.forEach(jsonFile => {
        try {
            const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            jsonData.push(data);
            jsonFileArr.push(jsonFile);
        } catch (error) {
            console.error(`Error processing JSON file ${jsonFile}:`, error);
        }
    });

    createPDF(outputPath, jsonData, jsonFileArr);
}
async function uploadFile(filePath) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath);

    // Define destination path in Firebase Storage
    const destinationPath = `uploads/${filePath}`;

    // Upload the file to Firebase Storage
    const uploadedFile = await bucket.upload(filePath, {
      destination: destinationPath,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4()
        },
        contentType: 'image/png'
      }
    });
    const [file] = await uploadedFile;

    const downloadURL = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2500', // Expiry date (optional, adjust as needed)
    });
    console.log(`File uploaded successfully to ${destinationPath}`);
    console.log('https://lens.google.com/uploadbyurl?url='+downloadURL);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

function appendOrCreateJSONFile(filename, data) {
	const fullPath = `case1/${filename}`; 
    return new Promise((resolve, reject) => {
        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(fullPath, JSON.stringify(data, null, 2), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve('File created and data written successfully.');
                    }
                });
            } else {
                // File exists, append the current JSON object to it
                fs.readFile(fullPath, 'utf8', (err, fileData) => {
                    if (err) {
                        reject(err);
                    } else {
                        let jsonData = [];
                        try {
                            jsonData = JSON.parse(fileData);
                            if (!Array.isArray(jsonData)) {
                                throw new Error('Existing data is not an array.');
                            }
                        } catch (parseError) {
                            reject(parseError);
                            return;
                        }
                        jsonData.push(data);
                        fs.writeFile(fullPath, JSON.stringify(jsonData, null, 2), (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve('Data appended to the existing file.');
                            }
                        });
                    }
                });
            }
        });
    });
}


async function getEmailData(email) {
    const options = {
        method: 'GET',
        url: 'https://email-data-leak-checker.p.rapidapi.com/emaild',
        params: {
            email: email
        },
        headers: {
            'User-Agent': 'application-name',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': 'ENTER YOUR X-RapidAPI-Key',
            'X-RapidAPI-Host': 'email-data-leak-checker.p.rapidapi.com'
        }
    };

    try {
        const res = await axios.request(options);
        return (res.data);
    } catch (error) {
        console.error(error);
        return -1
    }
}


finalData={}

app.get("/test",function(request,response){

	htmlContent= `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OSINT Automation Tool</title>
  <style>
  	 
    body {
      font-family: sans-serif;
      margin: 2rem;
    }

    header {
      text-align: center;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    main {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 1.2rem;
    }

    .path-list {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .path-list li {
      margin-bottom: 0.5rem;
    }

    .disclaimer {
      text-align: center;
      font-size: 0.8rem;
      color: #aaa;
    }
  </style>
</head>
<body>
  <header>
    <h1>OSINT Automation Tool</h1>
  </header>
  <main>
    <p>This tool can help you gather information through Open Source Intelligence (OSINT) techniques.</p>
    <h2>Available Paths:</h2>
    <ul class="path-list">
      <li>get-user-data/:email_id - Get user data for the email ID associated with a Google account (**Caution: Use responsibly**) </li>
      <li>google-dork/cv/:first_name/:last_name - Look for CVs of the target in the public domain</li>
      <li>/google-dork/:username - Look for accounts with the same username across sites (people tend to reuse usernames)</li>
      <li>/google-dork/:site_name/:first_name/:last_name - Look for their account on a specific site</li>
      <li>/get-loc-from-ip/:ip_addr - Get location estimate using a public IP address</li>
      <li>/get-loc-from-phone/:body - Get location estimate using a phone number (format: 91XXXXXXXXXX)</li>
      <li>/get-email-leak/:emailID - Find what data associated with this email ID has been leaked and where (**Caution: Use responsibly**) </li>
      <li>/get-bitcoin-trans/:address - Find transaction history of a specific crypto wallet address</li>
      <li>/create-pdf - Create a consolidated PDF of all generated data associated with this case</li>
    </ul>
  </main>
  <p class="disclaimer">**Disclaimer:** This tool is for educational purposes only. Use it responsibly and ethically.</p>
</body>
</html>
`
	// response.send({
	//   "message": "Welcome to OSINT Automation Tool",
	//   "paths": {
	//   	"get-user-data/:email_id":"get user data for the email_id associated with google account",
	//     "google-dork/cv/:first_name/:last_name ":"look for CV's of the target in public domain",
	//     "/google-dork/:username ":"look for account's with same user name across site's, people tend to use same username",
	//     "/google-dork/:site_name/:first_name/:last_name ":"look for their account on specific site name",
	//     "/get-loc-from-ip/:ip_addr ":"get location estimate using public IP address",
	//     "/get-loc-from-phone/:body ":"get location estimate using phone number, usage is 91XXXXXXXXXX",
	//     "/get-email-leak/:emailID ":"find what data associated with this email ID has been leaked and where",
	//     "/get-bitcoin-trans/:address ":"find transaction history of specific crypto wallet address",
	//     "/create-pdf ":"create a consolidated pdf of all generated data associated with this case. "
	//   }
	    
	// })
	response.send(htmlContent)
})

app.get("/get-user-data/:email_id", async function(request,response){
	const {email_id} = request.params;
	finalData["Email ID"]=email_id
	filename=`${email_id}_data.json`
	const command = `ghunt email --json filename ${email_id} | grep -E -A 1 "Probable|Custom profile|profile edit" > ${email_id}.txt`;

	exec(command, (error, stdout, stderr) => 
	{
		if (error)
		{
		console.error(`Error: ${error.message}`);
		return;
		}
		if (stderr)
		{
		console.error(`stderr: ${stderr}`);
		return;
		}
		console.log("Success!");
	});

	const py_command = `python3 loc_csv.py ${email_id}.json`;

	exec(py_command, (error, stdout, stderr) => 
	{
		if (error)
		{
		console.error(`Error: ${error.message}`);
		return;
		}
		if (stderr)
		{
		console.error(`stderr: ${stderr}`);
		return;
		}
		console.log("Success!");
	});
	try {
	  data = fs.readFileSync(`${email_id}.txt`, 'utf8');
	  console.log(data);
	} catch (err) {
	  console.error(err);
	}
	data=data.split("\n")
	appendOrCreateJSONFile(filename, finalData)
    .then((message) => console.log(message))
    .catch((error) => console.error('Error:', error));
	// response.status(200).json({Output:data});
	await delay(2500);
	response.sendFile(`${email_id}.html`, {root: __dirname })

})

app.get("/google-dork/cv/:first_name/:last_name",async function(request,response){
	/*
	{
		
		{
			position:pos
			title: title,
			link: url,
			snippet: data,
			source: source

		}
		
	}
	*/
	
	let cvArray = [];
	const {first_name, last_name } = request.params;
	filename=`${first_name+last_name}_data.json`
	finalData["Full Name"]=first_name+last_name
	finalData["CVs"]=[]
	const search_query="\"CV\" OR \"Curriculum Vitae\" filetype:PDF"+" \""+first_name+"\""+" \""+last_name+"\""
	const search_url="https://www.google.com/search?as_q="+search_query;
	console.log(search_url);
	search.json({
		q: search_query
	},async result => {
		await delay(2500)
	console.log(result)
	if(result && result["search_information"]["total_results"]!=0)
	{
		var org_res=result["organic_results"];
		org_res.forEach((searchObj)=>{
			//console.log(searchObj["position"],searchObj["title"],searchObj["link"],searchObj["source"],)
			finalData["CVs"].push(searchObj["link"]);
			let result = {
		        position: searchObj["position"],
		        title: searchObj["title"],
		        link: searchObj["link"],
		        snippet: searchObj["snippet"],
		        source: searchObj["source"]
		    	};
		    	cvArray.push(result);
		});
		//console.log(cvArray)
		appendOrCreateJSONFile(filename, finalData)
    		.then((message) => console.log(message))
    		.catch((error) => console.error('Error:', error));
		response.status(200).json(cvArray);
	}
	else
	{
		response.status(500).json({message:" No Data"});
	}
	})
})

app.get("/google-dork/:username", async function(request, response) {
    let url_array = [];
    const { username } = request.params;
    const query_array = [
        "inurl:" + username + " intitle:" + username,
        username + " site:instagram.com",
        username + " site:twitter.com",
        username + " site:linkedin.com",
        username + " site:snapchat.com",
        username + " site:reddit.com"
    ];
    filename=`${username}_data.json`
    console.log("Query Array:", query_array);

    try {
        const searchPromises = query_array.map((searchQuery) => {
            return new Promise((resolve, reject) => {
                search.json({ q: searchQuery }, (result) => {
                    resolve(result);
                });
            });
        });

        const searchResults = await Promise.all(searchPromises);

        searchResults.forEach((result) => {
            if (result && result["search_information"]["total_results"] !== 0) {
                const org_res = result["organic_results"];
                org_res.forEach((searchObj) => {
                    let result = {
                        position: searchObj["position"],
                        title: searchObj["title"],
                        link: searchObj["link"],
                        source: searchObj["source"]
                    };
                    url_array.push(result);
                });
            }
        });

        if (url_array.length > 0) {
        	finalData["URLS"]=url_array
        	appendOrCreateJSONFile(filename, finalData)
    			.then((message) => console.log(message))
    			.catch((error) => console.error('Error:', error));
            response.status(200).json(url_array);
        } else {
            response.status(500).json({ message: "No Data" });
        }
    } catch (error) {
        console.error("Error fetching search results:", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/google-dork/:site_name/:first_name/:last_name",async function(request,response){
	const { site_name, first_name, last_name } = request.params;
	/*
	{
		
		{
			position:pos
			title: title,
			link: url,
			source: source

		}
		
	}
	*/
	filename=`${first_name+last_name}_data.json`
	finalData["Full Name"]=first_name+last_name
	let site_array=[];
	
	//console.log(site_name,first_name,last_name);
	const search_query="\""+first_name+"\""+" \""+last_name+"\""+" site:"+site_name
	const search_url="https://www.google.com/search?as_q="+search_query;
	console.log(search_url);
	search.json({
		q: search_query
	},async result => {
		await delay(2500)
	console.log(result)
	if(result && result["search_information"]["total_results"]!=0)
	{
		var org_res=result["organic_results"];
		org_res.forEach((searchObj)=>{
			//console.log(searchObj["position"],searchObj["title"],searchObj["link"],searchObj["source"],)
			//console.log(searchObj["link"].split("/"))
			let result = {
		        position: searchObj["position"],
		        title: searchObj["title"],
		        link: searchObj["link"],
		        source: searchObj["source"]
		    	};
		    	site_array.push(result);
		});
		//console.log(site_array)
		finalData["URLS"]=site_array
		appendOrCreateJSONFile(filename, finalData)
    	.then((message) => console.log(message))
    	.catch((error) => console.error('Error:', error));
		response.status(200).json(site_array);

	}
	else
	{
		response.status(500).json({message:" No Data"});
	}
	})

	// console.log(search_response); 
})

app.get("/get-loc-from-ip/:ip_addr",function(request,response){
	const {ip_addr} = request.params;	
	const apiUrl = "https://ipwho.is/"+ip_addr;
	filename=`${ip_addr}_data.json`
	axios.get(apiUrl)
	    .then(res => {
	        //console.log(res.data);
	        finalData["IP Data"]=res.data
	        appendOrCreateJSONFile(filename, finalData)
   	 		.then((message) => console.log(message))
    		.catch((error) => console.error('Error:', error));
	        response.status(200).json(res.data);
	    })
	    .catch(error => {
	        //console.error('Error fetching data:', error);
	        response.status(500).json({message:"Error"});
	    });
})

app.get("/get-loc-from-phone/:body",function(request,response){
	var {body} = request.params;
	client.lookups.v2.phoneNumbers("+"+body)
                 .fetch({fields: 'line_type_intelligence'})
                 .then(phone_number => response.status(200).json(phone_number.lineTypeIntelligence));

})

app.get("/get-email-leak/:emailID",async function(request,response){
	var {emailID} = request.params;
	const result= await getEmailData(emailID)
	if(result===-1)
	{
		response.status(500).json({message: "Error"})
	}
	else
	{	
		filename=`${emailID}_leak.json`
		finalData["Leaked Data"]=result["results"]
        appendOrCreateJSONFile(filename, finalData)
	 		.then((message) => console.log(message))
			.catch((error) => console.error('Error:', error));
		response.status(200).json(result)
	}
})

app.get("/get-bitcoin-trans/:address",async function(request,response){
	var {address} = request.params;
	const variables = {
        "inboundDepth": 1,
        "outboundDepth": 1,
        "limit": 100,
        "offset": 0,
        "network": "bitcoin",
        "address": address,
        "from": null,
        "till": null,
        "dateFormat": "%Y-%m"
    };

    const url = "https://graphql.bitquery.io/";
    const opts = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": "ENTER BITQUERY API KEY"
        },
        body: JSON.stringify({
            query,
            'variables': variables
        })
    };
    
    try {
    	final_result={}
        result = await fetch(url, opts).then(res => res.json());
        await delay(3000)
        final_result["inbound"]=result["data"]["bitcoin"]["inbound"];
        final_result["outbound"]=result["data"]["bitcoin"]["outbound"];
    } catch (error) {
        console.error(error);
    }
	filename=`${address}_bitcoin.json`
	finalData["Bitcoin Transaction Data"]=final_result
    appendOrCreateJSONFile(filename, finalData)
 		.then((message) => console.log(message))
		.catch((error) => console.error('Error:', error));
	response.status(200).json(final_result)
})

app.get('/create-pdf', (req, res) => {
const directoryPath = 'ENTER PATH HERE/case1';
const outputPath = directoryPath+'output.pdf';;
processJSONFiles(directoryPath, outputPath);
    res.send('PDF created successfully!');
});

app.listen(5001,()=>{
	console.log("Server is running on port 5001")
})
