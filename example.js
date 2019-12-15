const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const timestamp = require('log-timestamp');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

const { Client } = require('pg');
const connectionString = 'postgres://mlgbrjxqombdxt:9e8239afd7e3387f3d3b60a8be19dd7c21f2494ff0814b1970f760199db5c05f@ec2-107-20-198-176.compute-1.amazonaws.com:5432/da5spegutq022d';
const client = new Client({
    connectionString: connectionString,
    ssl: true
});

//await connection
client.connect();

//EJS view engine (think of it sort of like PHP but it doesnt make you want the sweet release of death)
app.set('view engine', 'ejs');

//sets staticContent folder as the root for all static content (ie .../staticContent/app.js is accessed as ./app.js)
app.use(express.static('staticContent'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//when a GET request is made for the root we render the index.ejs page passing the API key in to be rendered as an HTML string response
app.get('/', (req, res) => res.render('index', { apikey: "" + process.env.API_KEY, page: "map" }, function(err, html) {
    res.send(html);
}));

app.get('/favorites', (req, res) => res.render('favs', { page: "fav" }, function(err, html) {
    res.send(html);
}));

//add to favorites return
app.post('/favorites', (req, res) => res.render('favs', { page: "fav" }, function(err, html) {
    res.send(html);
}));

app.get('/login', (req, res) => res.render('login', { page: "login" }, function(err, html) {
    res.send(html);
}));

app.get('/addfav', (req, res) => res.render('addFav', { page: "addFav" }, function(err, html) {
    res.send(html);
}));

app.get('/settings', (req, res) => res.render('settings', { page: "settings" }, function(err, html) {
    res.send(html);
}));

app.get('/about', (req, res) => res.render('about', { page: "about" }, function(err, html) {
    res.send(html);
}));

app.post('/doLogin', async(req, res) => {
    //get form data
    const user = req.body.lguser;
    const pw = req.body.lgpw;

    //DB query for username and hashed password here
    const loggingin = {
        text: "SELECT username, password FROM users WHERE username = $1",
        values: [user]
    };

    const { rows } = await client.query(loggingin.text, loggingin.values);

    try {
        if (rows.length == 0)
            return res.redirect('/login?error=badcredentials');
        if (bcrypt.compareSync(pw, rows[0].password)) {
            //login success
            const guid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); //random string
            //store username and guid in DB here
            const addToSession = {
                text: "SELECT startSession($1, $2)",
                values: [user, guid]
            };
            const sessRes = await client.query(addToSession);
            console.log("Login success!");
            const dataStr = `{"username":"${user}","uid":"${guid}"}`;
            res.render('handlingLogin', { data: dataStr }, function(err, html) {
                res.send(html);
            });
        } else {
            return res.redirect('/login?error=badcredentials');
        }
    } catch (e) {
        return res.redirect('/login?error=badcredentials');
    }
});

app.post('/doSignUp', async(req, res) => {
    const user = req.body.suuser;

    //TODO: add db query to confirm username isnt taken
    //COMPLETED ^ BUT WITHOUT TEST

    const question = "SELECT username, password FROM users WHERE username = $1";
    const value = [user];
    const output = await client.query(question, value);

    //This if statement only works if the username isn't taken.
    if (output.rowCount == 0) {
        const pw = req.body.supw;
        const pwc = req.body.supwc;
        console.log("Pass: " + pw + "\nConf: " + pwc);
        if (pw == pwc) {
            const pwHash = bcrypt.hashSync(req.body.supw, 10);
            //store in db
            //login stuff below
            const guid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); //random string
            const insertion = {
                text: "INSERT INTO users(username, password) VALUES ($1, $2)",
                values: [user, pwHash]
            };
            const addToSession = {
                text: "SELECT startSession($1, $2)",
                values: [user, guid]
            };
            const insRes = await client.query(insertion);
            const sessRes = await client.query(addToSession);
            console.log("Signup and Login success!");
            const dataStr = `{"username":"${user}","uid":"${guid}"}`;
            res.render('handlingLogin', { data: dataStr }, function(err, html) {
                res.send(html);
            });
        } else res.redirect('/login');

        //Test stuff. This prints out all the rows.
        // const data = res.rows
        // data.forEach(row => console.log(row))
    } else res.redirect('/login');
});

//API to check for valid login
app.post('/validate', (req, res) => {
    const inDatabase = false;
    const guid = req.body.guid;
    //check if it is in loggred in database
    if (inDatabase) {
        res.send(`{"login": true}`); //logged in confirmation
    } else res.send(`{"login": false}`); //not logged in
});

app.get('/places.json', (req, response) => {
    const out = client.query('SELECT * FROM locations')
        .then(res => res.rows)
        .then(row => response.send(row));
});

/*
 * TODO: Use GUID as query param
 */
app.get('/datafile.json', (req, response) => {
    console.log("id is ", req.query.id);
    const out = client.query({
            rowMode: 'array',
            text: 'SELECT getfavloc($1);',
            values: [req.query.id]
        })
        .then(res => response.send(JSON.parse(res.rows[0])));
});

app.get('/datafileWithID.json', (req, response) => {
    console.log("id is ", req.query.id);
    const out = client.query({
            rowMode: 'array',
            text: 'SELECT getfavloc2($1);',
            values: [req.query.id]
        })
        .then(res => response.send(JSON.parse(res.rows[0])));
});

/*
app.get('/categories.json', (req, response) => {
    const out = client.query({
            rowMode: 'array',
            text: 'SELECT DISTINCT "category" FROM "favoriteLocations" WHERE "userId" = ($1);',
            values: ['1']
        })
        .then(res => response.send(res.rows));
});
*/

app.post('/favorites-add', (req, response) => {
    const out = client.query({
            rowMode: 'array',
            text: 'SELECT addPlace($1, $2, $3);',
            values: [req.body.id, req.body.place, req.body.category]
        })
        .catch(e => console.log(e))
        .finally(response.redirect('/favorites'));
});

app.post('/favorites-remove', (req, response) => {
    const out = client.query({
            rowMode: 'array',
            text: 'SELECT removeFavLoc3($1, $2, $3);',
            values: [req.body.id, req.body.location, req.body.category]
        })
        .catch(e => console.log(e))
        .finally(response.redirect('/favorites'));
});

//start the server
app.listen(port, () => console.log(`Listening on port ${port}!`));