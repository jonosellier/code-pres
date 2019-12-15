const fs = require('fs');

let code = fs.readFileSync(process.argv[2], 'utf8');
code.replace("\r\n", "\n");

const obj = {
    "data": {
        "referenceCode": code,
        "lang": "js"
    },
    "slides": [{
            "title": "Navigate-a-Bull Server Overview",
            "content": "<p>This is Navigate-a-Bull's server!<p> <h2>It's sick AF</h2>",
            "showCodeFrom": 1
        },
        {
            "title": "The Libraries",
            "content": "Navigate-a-Bull uses many libraries such as <ul><li>Express</li><li>Node-Postgress</li><li>Bcrypt</li><ul>",
            "showCodeFrom": 1
        },
        {
            "title": "Log In functionality",
            "content": "This slide shows how the presentation scrolls code and does not explicitly need html markup for the code, this is all literally a string",
            "showCodeFrom": 65
        },
        {
            "title": "Log In functionality",
            "content": "Duplicating a slide and only changing the content and code position shows a different part of the code",
            "showCodeFrom": 103
        },
        {
            "title": "Code goes up as well",
            "content": "<h2>Its fucking sick</h2><h3>This is a different heading style, you have 6.</h3><p>Stuff can also be <b>bolder</b> for any style too</p>",
            "showCodeFrom": 36
        }
    ]
};

fs.writeFileSync('outfile.codepres', JSON.stringify(obj));