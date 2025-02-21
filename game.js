// buncha globas

const fetchLevelAddress = 'get-level.php';

const goalChars = ['🧀','🥨','🥯','🌭','🍔','🍟','🍕','🥪','🌯','🌮','🥙','🥓','🧇','🥞','🥩','🍗','🍖','🍌','🍉','🍋','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥝','🍅','🍆','🥑','🥦','🥬','🥒️','🍧','🥠','🍤','🍝','🥧','🧁'];
let collectedGoals = "";
const gameWidth = 102;
const gameHeight = 50;
const maxLength = gameWidth * gameHeight;

let lightDistance = 10;
let levelCounter = 0;
let difficulty = 0.1; // 0.0 - 1.0, affects enemy movement

const enemyWordList = ['such roge','wow.','iz fud?','very gen','many levl','henlo','much deth perm'];
const enemyColorList = ['#0ff','#f00','#0f0','#f0f'];

let status = "";
let lightsOn = false;
let invertedControls = false;

const dogeChance = 1; // chance of letter appearing (0 - 1 = 0 - 100%)
let dogeLetters = ['D','O','G','E'];
let collectedLetters = ['_','_','_','_'];

// get initial level and start the game
fetch('level.txt')
    .then(response => response.text())
    .then(text => {
        Game.init(text);
    });

const Game = {
    display: null,
    map: {},
    free: {},
    scheduler: null,
    engine: null,
    player: null,
    goal: null,
    letter: null,
    hidden: [],
    show: [],
    numEnemies: levelCounter,
    enemies: [],
    
    init: function(text) {
        
        ROT.Display.Rect.cache = true; // turn on caching (actually seems to slow things down)
        this.display = new ROT.Display({width:gameWidth,height:gameHeight});

        const gameDiv = document.getElementById('game');
        gameDiv.appendChild(this.display.getContainer());

        let freeCells = this._generateMapFromTxt(text);

        // place goal
        this._generateGoal(freeCells);
        this._addItems(freeCells);

        // set character
        this.player = this._createThing(Player, freeCells);
        // set enemies
        for (let i = 0; i < this.numEnemies; i++){
            this.enemies.push( this._createThing(Enemy, freeCells));
        }

        this.scheduler = new ROT.Scheduler.Speed();
        // add player to schedule
        this.scheduler.add(this.player, true);
        // add enemies to schedule
        for (let enemy of this.enemies) {
            this.scheduler.add(enemy, true);
        }

        this.engine = new ROT.Engine(this.scheduler);
        this.engine.start();
    },

    // draw loop
    draw: function(px, py) {

        this.display.clear();

        if(!lightsOn) {
            // pick box around player and calc lighting for the box
            xRange = [clamp(px - lightDistance, 0, gameWidth), clamp(px + lightDistance, 0, gameWidth)];
            yRange = [clamp(py - lightDistance, 0, gameHeight), clamp(py + lightDistance, 0, gameHeight)];

            for(let i = xRange[0]; i < xRange[1]; i++){
                for(let j = yRange[0]; j < yRange[1]; j++){
                    let key = i + "," + j;
                    let dist = calculateDistance((i-px),(j-py));

                    // draw walls within light
                    if(dist < lightDistance && key in this.map) {
                        // add to show if not already there
                        if(!this.show.includes(key)) this.show[key] = '.';
                    // draw ground within light
                    } else if (dist < lightDistance) {
                        this.display.draw(i, j, ".");
                    }
                }
            }

            // draw discovered objects (recolor special objs)
            for (let key in this.show) {
                let {x, y} = getCoords(key);
                this.display.draw(x, y, this.map[key], checkColor(key));
            }

        } else {
            // draw everything?
            for (let key in this.map){
                let {x, y} = getCoords(key);
                this.display.draw(x, y, this.map[key], checkColor(key))
            }
        }

        // draw text overlays
        this._drawBox(3,2,12,4);
        let txt = 'DOGELIKE';
        txtX = 4;
        txtY = 2;
        for (let chr of txt) this.display.draw(txtX++,  txtY + Math.round(Math.random()), chr, "#f00");

        // info stuff
        this._drawBox(83,2,100,11);
        // show DOGE gold
        this.display.drawText(84,3,"%c{yellow}" + '[  '
            + collectedLetters[0] + '  '
            + collectedLetters[1] + '  '
            + collectedLetters[2] + '  '
            + collectedLetters[3] + '  '
            + ']'
        );
        // show current level
        this.display.drawText(84,5,"flor: " + levelCounter);

        // show collected things
        let chrX = 85;
        for(let chr of collectedGoals)
            this.display.draw(chrX++,7, chr);
        
        // show current status
        this.display.drawText(85,9,"%c{#f0f}" + status);
        
    },

    _drawBox: function(x1,y1,x2,y2) {

        // vertical walls
        for(let i=y1; i<y2;i++) {
            this.display.draw(x1,  i, '|');
            this.display.draw(x2,  i, '|');
        }

        // horizontal walls
        for(let i=x1+1; i<x2;i++) {
            this.display.draw(i,  y1-1, '_');
            this.display.draw(i,  y2, '‾');
        }
    },

    nextLevelFromTxt: function(txt) {

        // clear enemies from scheduler
        for (let i = 0; i < this.numEnemies; i++){
            this.scheduler.remove(this.enemies[i]);
        }
        // clear enemies list
        this.enemies = [];

        // clear other vars
        this.show = [];
        this.hidden = [];
        this.map = {};
        this.free = {};
        this.goal = null;

        // turn off lite
        lightsOn = false;
        
        // increment level counter and enemies
        this.numEnemies = ++levelCounter;
        // increase difficulty
        difficulty += 0.1;

        //generate new map
        let freeCells = this._generateMapFromTxt(txt);
        // place goal
        this._generateGoal(freeCells);
        this._addItems(freeCells);

        // each new lvl , rndm percentage to drop a letter 
        if(Math.random() < dogeChance){
            // place letter
            this._addDogeLetter(freeCells);
        }

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

    reset: function() {
        
        // clear enemies from scheduler
        for (let i = 0; i < this.numEnemies; i++){
            this.scheduler.remove(this.enemies[i]);
        }

        // reset some other vars
        levelCounter = -1;
        collectedLetters = ['_','_','_','_'];
        collectedGoals = "";
        lightDistance = 10;
        difficulty = 0.2;
        status = "";
        lightsOn = false;
        invertedControls = false;

        // grab new level
        let txt = fetchNewLevel();
    }, 

    _generateMapFromTxt: function(txt) {
        // chop txt to max length (or add)
        if(txt.length > maxLength) txt = txt.substring(0,maxLength);
        if(txt.length < maxLength) txt = txt + ' '.repeat(maxLength - txt.Length);

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

    _addItems: function(freeCells) {
        // for now just add some random items
        for (let i=0; i < 4; i++) {
            let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            let key = freeCells.splice(index, 1)[0];

            this.map[key] = '?';
            this.hidden.push(key);
        }
    },

    _addDogeLetter: function(freeCells) {
        // grab a position
        let index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        let key = freeCells.splice(index, 1)[0];
        // grab a letter
        let letter = ROT.RNG.getItem(dogeLetters)

        this.map[key] = letter;
        this.letter = key;
        this.hidden.push(key);
    },
    
    _generateGoal: function(freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];

        // pick random food for goal char
        let chr = goalChars[Math.floor(Math.random()*goalChars.length)];

        this.map[key] = chr;
        this.goal = key;
        this.hidden.push(key);
    }
};

//
// PLAYER CLASS
//

class Player {
    constructor(x, y) {
        this._x = x;
        this._y = y;
        this.oldPos = {x,y};
        this._draw();
    }

    _draw() {
        // trigger main draw function
        Game.draw(this._x, this._y);
        Game.display.draw(this.oldPos.x, this.oldPos.y, "~");
        Game.display.draw(this._x, this._y, "@", "#ff0");
    }

    getSpeed() { return 100; };
    getPos() { return {x:this._x, y:this._y}; };

    setPostion(x, y) {
        this.oldPos.x = this._x;
        this.oldPos.y = this._y;
        this._x = x;
        this._y = y;
    }
        
    act() {
        Game.engine.lock();
        window.addEventListener("keydown", this);
    }
        
    handleEvent(e) {
    
        var keyMap = {};
        keyMap[38] = 0;
        keyMap[33] = 1;
        keyMap[39] = 2;
        keyMap[34] = 3;
        keyMap[40] = 4;
        keyMap[35] = 5;
        keyMap[37] = 6;
        keyMap[36] = 7;
        if(invertedControls){
            keyMap[38] = 4;
            keyMap[33] = 5;
            keyMap[39] = 6;
            keyMap[34] = 7;
            keyMap[40] = 0;
            keyMap[35] = 1;
            keyMap[37] = 2;
            keyMap[36] = 3;
        }
        
    
        var code = e.keyCode;
        /* one of numpad directions? */
        if (!(code in keyMap)) { return; }
    
        /* is there a free space? */
        var dir = ROT.DIRS[8][keyMap[code]];
        var newX = this._x + dir[0];
        var newY = this._y + dir[1];
        var newKey = newX + "," + newY;


        // what happens on this tile? (probably should put in Game logic)
        if (newKey == Game.goal) { 
            console.log("nice one"); 
            // add goal to collected
            collectedGoals += Game.map[Game.goal];
            // load new level here!
            fetchNewLevel();
        } else if(newKey == Game.letter) {
            // find position of letter in DOGE
            let chr = Game.map[newKey];
            let i = 'DOGE'.indexOf(chr);
            collectedLetters[i] = chr;
            // remove from doge letters array
            dogeLetters.splice(i,1);
            // remove from map
            delete Game.map[newKey];
            // add to free space?
            Game.free[newKey] = '.';
        } else if ((newKey in Game.map)) {
            if(Game.map[newKey] === '#') return;
    
            // S can be destroyed
            if(Game.map[newKey] === 'S') {
                // remove S from map
                delete Game.map[newKey];
                // add to free space?
                Game.free[newKey] = '.';
                return;
            }
    
            if(Game.map[newKey] === '?') {
                // Random Effect
                randomEffect();
                // remove from map
                delete Game.map[newKey];
                // add to free space?
                Game.free[newKey] = '.';
            }
        }
    
        this.setPostion(newX, newY);
        this._draw();
        window.removeEventListener("keydown", this);
        Game.engine.unlock();
    }
}

//
// ENEMY CLASS
//

class Enemy {

    constructor(x, y){
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
                console.log("oops");
                // make sure that enemy is actually close to player
                let {x,y} = Game.player.getPos();
                if(calculateDistance((x-this._x),(y-this._y)) < 2){
                    // Game.engine.lock();
                    status = "such oops!";
                    Game.reset();
                }
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


// requesting new levels from server
let fetchNewLevel = function(){
    console.log("Fetching :) Level...");
    fetch(fetchLevelAddress)
        .then(response => response.text())
        .then(text => {
            Game.nextLevelFromTxt(text);
        });
}

let calculateDistance = function(x,y){
    return Math.hypot(x,y);
    // return (x*x + y*y);
}

let clamp = function (num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}
let checkColor = function(key) {
    let drawColor = '#fff';

    if(key === Game.goal) {
        drawColor = '#f00';
    } else if(Game.map[key] === '?') {
        drawColor = '#0f0';
    } else if(key === Game.letter) {
        drawColor = '#ff0';
    }

    return drawColor;
}

let getCoords = function(key){
    let parts = key.split(",");
    let x = parseInt(parts[0]);
    let y = parseInt(parts[1]);

    return {x,y};
}

let randomEffect = function(){
    roll = Math.floor(Math.random() * 5);

    // adjust view
    if (roll == 0) 
    {
        status = "mor lite";
        lightDistance = clamp(lightDistance + 5, 5, 1000);
    }
    if (roll == 1) 
    {
        status = "les lite";
        lightDistance = clamp(lightDistance - 5, 5, 1000);
    }
    if (roll == 2) 
    {
        status = "such view";
        lightsOn = lightsOn ? false: true;
    }
    // show goal
    if (roll == 3) 
    {
        status = "hi fud!";
        // Game.hidden.splice(Game.hidden.indexOf(Game.goal),1);
        Game.show[Game.goal] = '.';

    }
    // invert controls
    if (roll == 4) 
    {
        status = "wow diz";
        invertedControls = invertedControls ? false: true;
    }
}





