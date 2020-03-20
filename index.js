const express = require('express')
const app = express()
const path = require('path')
const port = 3000

app.use(express.static(__dirname))

app.get('/',function(req,res) {
    res.sendFile(path.join(`${__dirname}/index.html`))
});

app.get('/new-level', function (req, res) {
    console.log("generate new level");
    // grab new level and send back

    // might include generating a level

    // for now just keep sending the same level
    const file = `${__dirname}/level.txt`;
    res.download(file); // Set disposition and send it.
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))