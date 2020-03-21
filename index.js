const express = require('express')
const app = express()
const path = require('path')
const port = 3000

app.use(express.static(__dirname))

app.get('/',function(req,res) {
    res.sendFile(path.join(`${__dirname}/index.html`))
});

app.get('/get-level', function (req, res) {
    console.log("generate new level");
    // grab new level and send back

    // might include generating a level

    // for now just send one of the generated levels
    let rnd = Math.floor(Math.random() * 21) + 1;
    const file = `${__dirname}/levels/level${rnd}.txt`;
    res.download(file); // Set disposition and send it.
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))