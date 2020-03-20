let goalChar = "%";
let gameWidth = 102;
let gameHeight = 60;
let lightDistance = 10;


fetch('level.txt')
.then(response => response.text())
.then(text => {
    // console.log(text);
    Game.init(text);
});
// outputs the content of the text file


let calculateLighting = function(px, py) {
    
    // loop through all the tiles
    for (let i = 0; i < gameHeight; i++) {
        for (let j = 0; j < gameWidth; j++) {
            let drawColor = '#fff';

            let clearKey = j + "," + i;
            let dist = Math.hypot(j-px, i-py);
            if(clearKey === Game.goal) drawColor = '#f00';

            // draw walls within light
            if(dist < lightDistance && clearKey in Game.map) {
                Game.display.draw(j, i, Game.map[clearKey], drawColor);
                // remove from hidden
                if(Game.hidden.includes(clearKey)) Game.hidden.splice(Game.hidden.indexOf(clearKey),1);
            // draw ground within light
            } else if (dist < lightDistance) {
                Game.display.draw(j, i, ".");
            // hide everything else except discovered stuff
            } else if(!Game.hidden.includes(clearKey)) {
                Game.display.draw(j, i, Game.map[clearKey], drawColor);
            } else {
                Game.display.draw(j, i, " ");
            }
            
        }
    }

}


var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    goal: null,
    hidden: [],
    
    init: function(text) {
        this.display = new ROT.Display({width:gameWidth,height:gameHeight});
        document.body.appendChild(this.display.getContainer());

        this._generateMapFromTxt(text);

        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();

        // fetch('level.txt').then(response => { response.text()})
        //     .then(data => {
        //         console.log(data);

                
        //     });
    },

    _generateMapFromTxt: function(txt) {
        // grab txt file (width is 100, height might be variable?)
        console.log(txt);
        // remove all newline chrs
        // data = data.replace('\n','');

        var freeCells = [];

        // iterate through chars and put into obj thing
        const width = gameWidth; // don't know why, but only way to correctly display
        for (let i = 0; i < txt.length; i++) {
            // get position
            let x = i % width;
            let y = Math.floor(i / width);
            let key = x+","+y;

            let chr = txt.charAt(i);
            if(/\s/.test(chr)) {
                // leave as empty space
                freeCells.push(key);
            } else {
                // assign char to map object {x,y,value}
                this.map[key] = chr;
                this.hidden.push(key);
                // console.log(key + " : " + chr);
            }
        }
        // drap map
        this._generateGoal(freeCells);
        // this._drawWholeMap();

        // create character
        this._createPlayer(freeCells);
    },

    _createPlayer: function(freeCells) {
        let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        let key = freeCells.splice(index, 1)[0];
        let parts = key.split(",");
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);


        calculateLighting(x, y);
        this.player = new Player(x, y);
    },
    
    _generateGoal: function(freeCells) {
        // for (var i=0;i<10;i++) {
        //     var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        //     var key = freeCells.splice(index, 1)[0];
        //     this.map[key] = "*";
        // }

        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        this.map[key] = goalChar;
        this.goal = key;
        this.hidden.push(key);
    },
    
    _drawWholeMap: function() {

        // for (var key in this.map) {
            // console.log(key + ' : ' + this.map[key]);
            // let parts = key.split(",");
            // let x = parseInt(parts[0]);
            // let y = parseInt(parts[1]);

            // fancy colors maybe
            // let amt = (x + y)/200;
            // let color = ROT.Color.interpolate([0, 0, 255], [0, 255, 255], amt);
            // this.display.draw(x, y, this.map[key], ROT.Color.toHex(color));

            // make goal a different color
            // if(key === this.goal){
            //     this.display.draw(x, y, this.map[key], "#f00");
            // } else {
            //     this.display.draw(x, y, this.map[key]);
            // }
        // }
    }
};

var Player = function(x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}
    
Player.prototype.act = function() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
}
    
Player.prototype.handleEvent = function(e) {

    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if (!(code in keyMap)) { return; }

    /* is there a free space? */
    var dir = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var newKey = newX + "," + newY;

    if (newKey == Game.goal) { 
        console.log("nice one"); 
        // load new level here!

        // request new image? maybe this can all be done in the BG while the user is palying the level
        // or I can just preload a bunch of doge
    } 
    else if ((newKey in Game.map)) { return; }

    calculateLighting(newX, newY);

    // Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    Game.display.draw(this._x, this._y, "~");
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}


