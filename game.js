let goalChar = "%";
let gameWidth = 102;
let gameHeight = 60;
let lightDistance = 10;
let levelCounter = 1;
let difficulty = 0.2; // 0.0 - 1.0 

let enemyWordList = ['such roge','wow.','iz fud?','very gen','many levl','henlo','much deth perm'];
let enemyColorList = ['#0ff','#0f0','#00f','#f0f'];

// get initial level and start the game
fetch('level.txt')
.then(response => response.text())
.then(text => {
    // console.log(text);
    Game.init(text);
});

// function for requesting new levels
let fetchNewLevel = function(){
    console.log("Fetching (haha) Level...");
    fetch('new-level')
        .then(response => response.text())
        .then(text => {
            Game.nextLevelFromTxt(text);
        });
}

// This draws the level and handles everything (should change to drawLevel())
let calculateLighting = function(px, py) {
    
    // loop through all the tiles
    for (let i = 0; i < gameHeight; i++) {
        for (let j = 0; j < gameWidth; j++) {
            let drawColor = '#fff';

            let clearKey = j + "," + i;
            let dist = Math.hypot(j-px, i-py);
            if(clearKey === Game.goal) {
                drawColor = '#f00';
            }

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

            // console.log("done drawing");
            
        }
    }
}


const Game = {
    display: null,
    map: {},
    free: {},
    scheduler: null,
    engine: null,
    player: null,
    goal: null,
    hidden: [],
    numEnemies: levelCounter,
    enemies: [],
    
    init: function(text) {
        this.display = new ROT.Display({width:gameWidth,height:gameHeight});
        document.body.appendChild(this.display.getContainer());

        let freeCells = this._generateMapFromTxt(text);

        // place goal
        this._generateGoal(freeCells);

        // set character
        this.player = this._createThing(Player, freeCells);
        // set enemies
        for (let i = 0; i < this.numEnemies; i++){
            this.enemies.push( this._createThing(Enemy, freeCells));
        }

        this.scheduler = new ROT.Scheduler.Simple();
        // add player to schedule
        this.scheduler.add(this.player, true);
        // add enemies to schedule
        for (let enemy of this.enemies) {
            this.scheduler.add(enemy, true);
        }

        this.engine = new ROT.Engine(this.scheduler);
        this.engine.start();
    },

    nextLevelFromTxt: function(txt) {
        // clear enemies from scheduler
        for (let i = 0; i < this.numEnemies; i++){
            this.scheduler.remove(this.enemies[i]);
        }
        // clear enemies list
        this.enemies = [];

        // clear other vars
        this.hidden = [];
        this.map = {};
        this.free = {};
        this.goal = null;
        
        // increment level counter and enemies
        this.numEnemies = ++levelCounter;
        // increase difficulty
        difficulty += 0.1;

        //generate new map
        let freeCells = this._generateMapFromTxt(txt);
        // place goal
        this._generateGoal(freeCells);

        // set up player
        const {x,y} = this._placeThing(freeCells);
        this.player.setPostion(x,y);
        // fix tail
        this.player.oldPos.x = x+1;
        this.player.oldPos.y = y;

        // draw player (sorry I'm not obeying private/publicccc)
        this.player._draw();


        // setup new enemiesz
        for (let i = 0; i < this.numEnemies; i++){
            // add enemy
            this.enemies.push(this._createThing(Enemy, freeCells));
            this.scheduler.add(this.enemies[i], true);

            const {x,y} = this._placeThing(freeCells);
            this.enemies[i]._draw();
        }
    },

    _generateMapFromTxt: function(txt) {
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
                this.free[key] = ".";
            } else {
                // assign char to map object {x,y,value}
                this.map[key] = chr;
                this.hidden.push(key);
                // console.log(key + " : " + chr);
            }
        }

        return freeCells;
    },

    _placeThing: function(freeCells) {
        let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        let key = freeCells.splice(index, 1)[0];
        let parts = key.split(",");
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);

        return {x, y};
    },

    _createThing: function(what, freeCells) {
        const {x,y} = this._placeThing(freeCells);
        return new what(x, y);
    },
    
    _generateGoal: function(freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        this.map[key] = goalChar;
        this.goal = key;
        this.hidden.push(key);
    }
};

let Player = function(x, y) {
    this._x = x;
    this._y = y;
    this.oldPos = {x,y};
    this._draw();
}

Player.prototype.getSpeed = function() { return 100; };
Player.prototype.getPos = function() { return {x:this._x, y:this._y}; };

Player.prototype.setPostion = function(x, y) {
    this.oldPos.x = this._x;
    this.oldPos.y = this._y;
    this._x = x;
    this._y = y;
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
        fetchNewLevel();
    } 
    else if ((newKey in Game.map)) { return; }

    // calculateLighting(newX, newY);

    // Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    this.setPostion(newX, newY);
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._draw = function() {
    calculateLighting(this._x, this._y);
    Game.display.draw(this.oldPos.x, this.oldPos.y, "~");
    Game.display.draw(this._x, this._y, "@", "#ff0");
}   


class Enemy {

    constructor(x,y){
        this.word = enemyWordList[Math.floor(Math.random() * enemyWordList.length)];
        this.color = enemyColorList[Math.floor(Math.random() * enemyColorList.length)];
        this._x = x;
        this._y = y;

        this.prevPos = [];
        for (let i=0; i < this.word.length; i++) {
            this.prevPos.push({
                x: this._x + i,
                y: this._y
            });
        }

        this._draw();
    }

    _draw(){
        for (let i=0; i < this.prevPos.length; i++) {
            Game.display.draw(this.prevPos[i].x, this.prevPos[i].y, this.word[i], this.color);
        }
    }

    setPosition(x, y){
        this._x = x;
        this._y = y;

        // add new pos to start
        this.prevPos.unshift({x,y});
        // remove old from end
        this.prevPos.pop();
    }

    getSpeed() { return 100; }

    act(){
        // sometimes pick random other location
        let {x,y} = Game.player.getPos();
        if(Math.random() > difficulty){
            let keys = Object.keys(Game.free);
            let key = keys[ keys.length * Math.random() << 0];
            let parts = key.split(",");
            x= parseInt(parts[0]);
            y= parseInt(parts[1]);
        }
        

        var passableCallback = function(x, y) {
            return (x+","+y in Game.free);
        }
        var astar = new ROT.Path.AStar(x, y, passableCallback, {topology:4});

        var path = [];
        var pathCallback = function(x, y) {
            path.push([x, y]);
        }
        astar.compute(this._x, this._y, pathCallback);

        path.shift();
        try {
            if (path.length == 1) {
                // Game.engine.lock();
                // alert("Game over - you were captured by Enemy!");
            } else {
                x = path[0][0];
                y = path[0][1];
    
                // Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
                this.setPosition(x,y);
            }
        } catch(error) {
            // just don't worry about it
        }

        this._draw();
        
    }
}
