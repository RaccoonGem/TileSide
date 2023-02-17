const canvasBG = document.getElementById("background");
const canvasML = document.getElementById("midLayer");
const canvasTL = document.getElementById("topLayer");

const ctxBG = canvasBG.getContext("2d");
const ctxML = canvasML.getContext("2d");
const ctxTL = canvasTL.getContext("2d");

let cursorX = 0; //The position of the mouse when it's on the canvas
let cursorY = 0;
let selX = -1; //The coordinates of the square on the board that the mouse is hovering over
let selY = -1; //(both will be -1 when it's off the board)
let hand = -1; //The number of the tile being held by the player (-1 if they aren't holding one)
let deck = []; //The number of each tile in the slots at the bottom
let score = 0;
let rAnim = 0;
let gameState = "menu";
let gameStarted = false;
let timer = 0;

let allowRot = 0;
let weirdRot = 0;

let asymSides = 0;
let colN = 4; //The number of colors for tile sides to choose from

let deckSlots = 3;
let deckBehavior = 0; //0: no slots refresh until all empty. 1: empty slot refreshes. 2: all slots refresh.

let col = ["#FFFFFF", "#BFBFBF", "#000000", "#FF0000", "#00BF00", "#0000FF", "#FFDF00", "#00FFFF", "#FF00FF", "#FF7F00", "#7F00FF"]; //The hex values of the game's colors. The first is the color of a tile, the rest are for the sides
let colScheme = 0;
let colSchemeName = ["Default", "Graph Paper", "Geothermal"];

let board = [
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,]
]; //The board, a 2D array, where each spot is the number of the tile that sits there, or -1 for no tile

let tiles = []; //The array which stores each tile that is created

function Tile () { //Constructor for tiles. The parameters are what color each side will be, and then the 12 positions are randomized
    this.pos = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; //A position being "0" means it's blank
    this.stacked = -1; //The tile stacked on top of this one. -1 means no tile
    let north = Math.ceil(Math.random() * colN) + 1;
    let east = Math.ceil(Math.random() * colN) + 1;
    let south = Math.ceil(Math.random() * colN) + 1;
    let west = Math.ceil(Math.random() * colN) + 1;
    if (asymSides == 0) {
        while (this.pos[0] + this.pos[1] + this.pos[2] == 0) {
            this.pos[0] = Math.round(Math.random()) * north;
            this.pos[1] = Math.round(Math.random()) * north;
            this.pos[2] = Math.round(Math.random()) * north;
            this.pos[3] = this.pos[1];
            this.pos[4] = this.pos[0];
        }
        while (this.pos[5] + this.pos[6] + this.pos[7] == 0) {
            this.pos[5] = Math.round(Math.random()) * east;
            this.pos[6] = Math.round(Math.random()) * east;
            this.pos[7] = Math.round(Math.random()) * east;
            if (this.pos[4] != 0 && this.pos[4] != this.pos[5]) {
                this.pos[5] = 0;
            }
            this.pos[8] = this.pos[6];
            this.pos[9] = this.pos[5];
        }
        while (this.pos[10] + this.pos[11] + this.pos[12] == 0) {
            this.pos[10] = Math.round(Math.random()) * south;
            this.pos[11] = Math.round(Math.random()) * south;
            this.pos[12] = Math.round(Math.random()) * south;
            if (this.pos[9] != 0 && this.pos[9] != this.pos[10]) {
                this.pos[10] = 0;
            }
            this.pos[13] = this.pos[11];
            this.pos[14] = this.pos[10];
        }
        while (this.pos[15] + this.pos[16] + this.pos[17] == 0) {
            this.pos[15] = Math.round(Math.random()) * west;
            this.pos[16] = Math.round(Math.random()) * west;
            this.pos[17] = Math.round(Math.random()) * west;
            if (this.pos[14] + this.pos[0] != 0 && (this.pos[14] != this.pos[15] || this.pos[0] != this.pos[15])) {
                this.pos[15] = 0;
            }
            this.pos[18] = this.pos[16];
            this.pos[19] = this.pos[15];
        }
    }
    else {
        while (this.pos[0] + this.pos[1] + this.pos[2] + this.pos[3] + this.pos[4] == 0) {
            this.pos[0] = Math.round(Math.random()) * north;
            this.pos[1] = Math.round(Math.random()) * north;
            this.pos[2] = Math.round(Math.random()) * north;
            this.pos[3] = Math.round(Math.random()) * north;
            this.pos[4] = Math.round(Math.random()) * north;
        }
        while (this.pos[5] + this.pos[6] + this.pos[7] + this.pos[8] + this.pos[9] == 0) {
            this.pos[5] = Math.round(Math.random()) * east;
            this.pos[6] = Math.round(Math.random()) * east;
            this.pos[7] = Math.round(Math.random()) * east;
            this.pos[8] = Math.round(Math.random()) * east;
            this.pos[9] = Math.round(Math.random()) * east;
            if (this.pos[4] != 0 && this.pos[4] != this.pos[5]) {
                this.pos[5] = 0;
            }
        }
        while (this.pos[10] + this.pos[11] + this.pos[12] + this.pos[13] + this.pos[14] == 0) {
            this.pos[10] = Math.round(Math.random()) * south;
            this.pos[11] = Math.round(Math.random()) * south;
            this.pos[12] = Math.round(Math.random()) * south;
            this.pos[13] = Math.round(Math.random()) * south;
            this.pos[14] = Math.round(Math.random()) * south;
            if (this.pos[9] != 0 && this.pos[9] != this.pos[10]) {
                this.pos[10] = 0;
            }
        }
        while (this.pos[15] + this.pos[16] + this.pos[17] + this.pos[18] + this.pos[19] == 0) {
            this.pos[15] = Math.round(Math.random()) * west;
            this.pos[16] = Math.round(Math.random()) * west;
            this.pos[17] = Math.round(Math.random()) * west;
            this.pos[18] = Math.round(Math.random()) * west;
            this.pos[19] = Math.round(Math.random()) * west;
            if (this.pos[14] != 0 && this.pos[14] != this.pos[15]) {
                this.pos[15] = 0;
            }
            if (this.pos[0] != 0 && this.pos[0] != this.pos[19]) {
                this.pos[19] = 0;
            }
        }
    }
    this.rPos = this.pos; //"real position" or "read position", what to read for stacked tiles
}

function ruleInit() {
    allowRot = 1;
    weirdRot = 0;

    asymSides = 0;
    colN = 4;

    deckSlots = 3;
    deckBehavior = 1;
}

function newGame() {
    tiles = [];
    hand = -1;
    deck.length = deckSlots; //Creates the opening set of tiles in the deck
    for (let f = 0; f < deckSlots; f++) {
        tiles.push(new Tile());
        deck[f] = f;
    }
    for (let n = 0; n < 8; n++) { //Makes it so each spot on the board array is -1 / empty
        for (let m = 0; m < 8; m++) {
            board[m][n] = -1;
        }
    }
}

function calcRPos(t1, t2) { //t1 is stacked onto, t2 is on top
    let result = [];
    result.length = 20;
    if (Math.sign(t1) == -1 || Math.sign(t2) == -1) {
        return Math.sign(t1) == -1 ? tiles[t2].pos : tiles[t1].pos;
    }
    for (f = 0; f < 20; f++) {
        result[f] = tiles[t2].pos[f] || tiles[t1].pos[f];
    }
    return result; //returns what the positions would be if t2 were stacked on top of t1
}

function match(p) {
    return (p + 14 - (2 * (p % 5))) % 20;
}

function checkSide(t1, t2, s) { //t1 and t2 are the numbers of the two tiles being checked against each other
    s *= 5; //s is passed in as either 0, 1, 2, or 3, depending on the side of t1 being checked against (0 is the top, goes around clockwise)
    let scoreToAdd = 0; //If the two tiles are deemed compatible, scr will be returned as the point value of their union
    if (t1 == -1 || t2 == -1) {
        return 0; //If either t1 or t2 is actually -1, meaning it's no tile at all, simply return 0
    }
    tiles[t1].rPos = calcRPos(t1, tiles[t1].stacked);
    tiles[t2].rPos = calcRPos(t2, tiles[t2].stacked);
    for (let S = s; S < s + 5; S++) {
        if (tiles[t1].rPos[S] * tiles[t2].rPos[match(S)] != 0) {
            if (tiles[t1].rPos[S] != tiles[t2].rPos[match(S)]) {
                return -1; //If they are not compatible, -1 will be returned instead.
            } else {
                scoreToAdd += 1;
            }
        }
    }
    return scoreToAdd;
}

function checkCompat (x1, y1, t) { //basically performs a bunch of checkSide and if any of them return -1 this function returns "false"
    if (y1 > 0){
        if (checkSide(t, board[x1][y1 - 1], 0) == -1) {
            return false;
        }
    }
    if (x1 < 7){
        if (checkSide(t, board[x1 + 1][y1], 1) == -1) {
            return false;
        }
    }
    if (y1 < 7){
        if (checkSide(t, board[x1][y1 + 1], 2) == -1) {
            return false;
        }
    }
    if (x1 > 0){
        if (checkSide(t, board[x1 - 1][y1], 3) == -1) {
            return false;
        }
    }
    return true;
}

function checkStackCompat (t1, t2) { //checks whether or not t2 can be stacked onto t1
    if (t1 == -1 || t2 == -1) {
        return false;
    }

    let rT = calcRPos(t1, t2);
    for (let f = 0; f < 20; f++) {
        if (rT[f] * rT[(f + 19) % 20] != 0 && rT[f] != rT[(f + 19) % 20]) {
            return false;
        }
        if (rT[f] * rT[(f + 1) % 20] != 0 && rT[f] != rT[(f + 1) % 20]) {
            return false;
        }
    }
    return true;
}

function calcScore() { //racks up the score of the entire board
    score = 0;
    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (m < 7) {
                score += checkSide(board[m][n], board[m + 1][n], 1);
            }
            if (n < 7) {
                score += checkSide(board[m][n], board[m][n + 1], 2);
            }
        }
    }
}

function pointInArea(pX, pY, aX, aY, aW, aH) {
    return (pX >= aX && pX <= (aX + aW) && pY >= aY && pY <= (aY + aH));
}

function refreshDeck() {
    switch (deckBehavior) {
        case 0:
            let allEmpty = true;
            for (let f = 0; f < deckSlots; f++) {
                if (deck[f] != -1) {
                    allEmpty = false;
                }
            }
            if (!allEmpty) break;
            for (let f = 0; f < deckSlots; f++) {
                deck[f] = tiles.length;
                tiles.push(new Tile());
            }
            break;
        case 1:
            for (let f = 0; f < deckSlots; f++) {
                if (deck[f] == -1) {
                    deck[f] = tiles.length;
                    tiles.push(new Tile());
                }
            }
            break;
        case 2:
            let anyEmpty = false;
            for (let f = 0; f < deckSlots; f++) {
                if (deck[f] == -1) {
                    anyEmpty = true;
                }
            }
            if (!anyEmpty) break;
            for (let f = 0; f < deckSlots; f++) {
                if (deck[f] == -1) {
                    deck[f] = tiles.length;
                    tiles.push(new Tile());
                } else {
                    tiles[deck[f]] = new Tile();
                }
            }
            break;
        default:
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function displayPos(c, t, x, y, s, r) { //parameters are Canvas, Tile (an array of its 20 positions), X and Y coordinates, Size, and Rotation
    c.resetTransform();
    c.translate(x, y);
    c.scale(s / 10, s / 10);
    c.rotate(r);
    for (let p = 0; p < 20; p++) {
        if (t[p] == 0) {
            if (p % 5 == 4) {
                c.rotate(Math.PI / 2);
            }
            continue;
        }
        c.fillStyle = col[t[p]];
        c.strokeStyle = col[t[p]];
        switch (p % 5) {
            case 0:
                if (t[(p + 19) % 20] == t[p]) {
                    c.fillRect(-5, -5, 2, 2);
                } else {
                    c.beginPath();
                    c.moveTo(-5, -5);
                    c.lineTo(-3, -5);
                    c.lineTo(-3, -3);
                    c.fill();
                }
                break;
            case 1:
                c.fillRect(-3, -5, 2, 2);
                break;
            case 2:
                c.fillRect(-1, -5, 2, 2);
                break;
            case 3:
                c.fillRect(1, -5, 2, 2);
                break;
            case 4:
                if (t[(p + 1) % 20] != t[p]) {
                    c.beginPath();
                    c.moveTo(3, -5);
                    c.lineTo(5, -5);
                    c.lineTo(3, -3);
                    c.fill();
                }
                c.rotate(Math.PI / 2);
                break;
            default:
        }
    }
    c.resetTransform();
}

function displayKey(c, key, x, y) { //Draws an icon on context c depicting a key at (x, y)
    c.resetTransform();
    c.translate(x, y);
    c.fillStyle = col[0];
    c.fillRect(-10, -10, 20, 20);
    c.fillStyle = col[2];
    c.font = "16px monospace";
    c.textAlign = "center";
    c.fillText(key, 0, 6);
    c.resetTransform();
}

function displayArrow(c, x, y, l, r) { //Draws an arrow on context c with a center of (x, y), a length of l, and a rotation of r radians (starts pointing up, goes clockwise)
    c.resetTransform();
    c.fillStyle = col[0];
    c.translate(x, y);
    c.rotate(r);
    c.beginPath();
    c.moveTo(0, l / -2);
    c.lineTo(10, (l / -2) + 10);
    c.lineTo(-10, (l / -2) + 10);
    c.fill();
    c.fillRect(-5, (l / -2) + 9, 10, l - 14);
    c.resetTransform();
}

////////////////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener('keydown', (event) => { //Key presses, for rotating and stacking tiles
    const keyName = event.key.toLowerCase();
    if (gameState == "game") {
        if (keyName === 'a' && hand != -1) {
            if (weirdRot == 1){
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.length = 20;
            } else if (allowRot == 1){
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.push(tiles[hand].pos.shift());
                tiles[hand].pos.length = 20;
                rAnim += Math.PI / 2;
            }
            if (tiles[hand].stacked != -1) {
                if (weirdRot == 1) {
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.length = 20;
                } else if (allowRot == 1) {
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                    tiles[tiles[hand].stacked].pos.length = 20;
                }
            }
            drawTiles();
        }

        if (keyName === 'd' && hand != -1) {
            if (weirdRot == 1){
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.length = 20;
            } else if (allowRot == 1){
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.unshift(tiles[hand].pos[19]);
                tiles[hand].pos.length = 20;
                rAnim -= Math.PI / 2;
            }
            if (tiles[hand].stacked != -1) {
                if (weirdRot == 1) {
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.length = 20;
                } else if (allowRot == 1) {
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[19]);
                    tiles[tiles[hand].stacked].pos.length = 20;
                }
            }
            drawTiles();
        }

        if (keyName === 's') {
            if (tiles[board[selX][selY]].stacked == -1 && hand != -1 && tiles[hand].stacked == -1) {
                if (checkStackCompat(board[selX][selY], hand) && checkCompat(selX, selY, hand)) {
                    tiles[board[selX][selY]].stacked = hand;
                    hand = -1;
                    refreshDeck(); //refresh the deck if it needs it upon stacking a tile successfully
                }
            } else if (tiles[board[selX][selY]].stacked != -1 && hand == -1) {
                hand = tiles[board[selX][selY]].stacked;
                tiles[board[selX][selY]].stacked = -1;
                if (!checkCompat(selX, selY, board[selX][selY])) {
                    tiles[board[selX][selY]].stacked = hand;
                    hand = -1;
                }
            }
            drawTiles();
        }
    }
}, false);

canvasTL.addEventListener('mousemove', (event) => { //tracks mouse movement, does the math for what's selected
    cursorX = event.offsetX;
    cursorY = event.offsetY;
    selX = Math.round((cursorX - 60) / 40);
    selY = Math.round((cursorY - 100) / 40);
    if (selX < 0 || selX >= 8 || selY < 0 || selY >= 8) {
        selX = -1;
        selY = -1;
    }
}, false);

canvasTL.addEventListener('click', (event) => {
    if (gameState == "game") {
        if (selX != -1 && checkCompat(selX, selY, hand)) { //swapping / picking up / putting down tiles
            hand += board[selX][selY];
            board[selX][selY] = hand - board[selX][selY];
            hand -= board[selX][selY];
            refreshDeck(); //refresh the deck if it needs it upon placing a tile successfully
        }
        
        for (let f = 0; f < deckSlots; f++) { // the deck
            if (pointInArea(cursorX, cursorY, Math.round((320 / (deckSlots + 1)) * (f + 1)) + 20, 420, 40, 40)) {
                if (hand == -1) {
                    hand = deck[f];
                    deck[f] = -1;
                } else if (deck[f] == -1) {
                    deck[f] = hand;
                    hand = -1;
                }
            }
        }

        if (pointInArea(cursorX, cursorY, 520, 420, 100, 40)) { //The menu button
            gameState = "menu";
            requestAnimationFrame(draw);
        }
        else drawTiles();
    } else if (gameState == "menu") { ////////////////////////////////////
        if (pointInArea(cursorX, cursorY, 400, 80, 200, 80)) {
            ruleInit();
            newGame();
            gameStarted = true;
            gameState = "game";
        }
        if (pointInArea(cursorX, cursorY, 400, 400, 200, 60)) {
            gameState = "menuC";
        }

        if (gameStarted && pointInArea(cursorX, cursorY, 400, 200, 200, 60)) {
            gameState = "game";
        }

        if (pointInArea(cursorX, cursorY, 20, 420, 40, 40)) {
            colScheme = (colScheme + 1) % colSchemeName.length;
            switch (colScheme) {
                case 0:
                    col = ["#FFFFFF", "#BFBFBF", "#000000", "#FF0000", "#00BF00", "#0000FF", "#FFDF00", "#00FFFF", "#FF00FF", "#FF7F00", "#7F00FF"];
                    break;
                case 1:
                    col = ["#FFFFDF", "#6F6F6F", "#000000", "#005FFF", "#FF0000", "#00BF00", "#7F7F7F", "#00009F", "#8F0000", "#007F00", "#FF00FF"];
                    break;
                case 2:
                    col = ["#00007F", "#9F9F9F", "#FFFFFF", "#FFDF00", "#FF7F00", "#FF0000", "#BFBFBF", "#00FFFF", "#0000FF", "#FF00FF", "#00FF00"];
                    break;
                default:
            }
        }
        requestAnimationFrame(draw);
    } else if (gameState == "menuC") { //////////////////////////////////
        if (selX == 0 && selY == 0) {
            allowRot = 1 - allowRot;
        }
        if (selX == 0 && selY == 1) {
            weirdRot = 1 - weirdRot;
        }
        if (allowRot == 0) {
            weirdRot = 0;
        }

        if (selX == 2 && selY == 0) {
            asymSides = 1 - asymSides;
        }
        if (selX == 2 && selY == 1) {
            colN = (colN % (col.length - 2)) + 1;
        }

        if (selX == 4 && selY == 0) {
            deckSlots = (deckSlots % 5) + 1;
        }
        if (selX == 4 && selY == 1) {
            deckBehavior = (deckBehavior + 1) % 3;
        }

        if (pointInArea(cursorX, cursorY, 380, 420, 120, 40)) {
            newGame();
            gameStarted = true;
            gameState = "game";
            requestAnimationFrame(draw);
        }

        if (pointInArea(cursorX, cursorY, 520, 420, 100, 40)) {
            gameStarted = false;
            gameState = "menu";
            requestAnimationFrame(draw);
        }
    }
}, false);

function init() { //starts things up
    ruleInit();
    newGame();
    draw();
}

function draw() {
    ctxBG.clearRect(0, 0, 640, 480);
    ctxML.clearRect(0, 0, 640, 480);
    ctxTL.clearRect(0, 0, 640, 480);
    switch (gameState) {
        case "menu":
            drawMenu();
            break;
        case "menuC":
            drawMenuC();
            break;
        case "game":
            drawBG();
            drawTiles();
            drawCursor();
            break;
        default:
    }
}

function drawMenu() { ///////////////////////////////////////////////////////////////////////
    const ctx = canvasBG.getContext("2d");
    ctx.clearRect(0, 0, 640, 480);

    ctx.fillStyle = col[1];
    ctx.fillRect(0, 0, 640, 480); //The background

    ctx.fillStyle = col[0];
    ctx.fillRect(400, 80, 200, 80);
    if (gameStarted) {
        ctx.fillRect(400, 200, 200, 60);
    }
    ctx.fillRect(400, 400, 200, 60);
    ctx.fillRect(20, 420, 40, 40);

    for (let f = 0; f < colN; f++) {
        ctx.fillStyle = col[f + 2];
        ctx.beginPath();
        ctx.moveTo(40, 440);
        ctx.arc(40, 440, 15, ((f / colN) - (1 / 4)) * Math.PI * 2, (((f + 1) / colN) - (1 / 4)) * Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = col[2];
    ctx.font = "64px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TileSide", 200, 75);
    if (!gameStarted) {
        ctx.fillText("PLAY", 500, 140);
    }

    if (gameStarted) {
        ctx.font = "36px monospace";
        ctx.fillText("New Game", 500, 132);
        ctx.fillText("Continue", 500, 240);
    }

    ctx.font = "48px monospace";
    ctx.fillText("Custom", 500, 445);

    ctx.font = "18px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Color Scheme: " + colSchemeName[colScheme], 65, 447);
}

function drawMenuC() { ////////////////////////////////////////////////////////////////////////////
    const ctx = canvasBG.getContext("2d");
    ctx.clearRect(0, 0, 640, 480);

    ctx.fillStyle = col[1];
    ctx.fillRect(0, 0, 640, 480); //The background
    ctx.fillStyle = col[0];
    ctx.fillRect(40, 80, 320, 320);

    ctx.fillRect(380, 420, 120, 40);
    ctx.fillRect(520, 420, 100, 40);

    ctx.strokeStyle = col[1]; //draws a grid
    ctx.lineWidth = 1;
    for (let f = 0; f < 7; f++) {
        ctx.beginPath();
        ctx.moveTo((40 * f) + 80, 80);
        ctx.lineTo((40 * f) + 80, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40, (40 * f) + 120);
        ctx.lineTo(360, (40 * f) + 120);
        ctx.stroke();
    }

    ctx.strokeStyle = col[1];
    ctx.fillStyle = col[1];
    ctx.beginPath();
    ctx.arc(60, 100, 15, 0, Math.PI * 2);
    allowRot == 1 ? ctx.fill() : ctx.stroke();
    ctx.beginPath();
    ctx.arc(60, 140, 15, 0, Math.PI * 2);
    weirdRot == 1 ? ctx.fill() : ctx.stroke();
    ctx.beginPath();
    ctx.arc(140, 100, 15, 0, Math.PI * 2);
    asymSides == 1 ? ctx.fill() : ctx.stroke();
    ctx.beginPath();
    ctx.arc(220, 100, 15, 0, Math.PI * 2);
    deckSlots == 1 ? ctx.stroke() : ctx.fill();
    ctx.beginPath();
    ctx.arc(220, 140, 15, 0, Math.PI * 2);
    ctx.stroke();

    for (let f = 0; f < colN; f++) {
        ctx.fillStyle = col[f + 2];
        ctx.beginPath();
        ctx.moveTo(140, 140);
        ctx.arc(140, 140, 15, ((f / colN) - (1 / 4)) * Math.PI * 2, (((f + 1) / colN) - (1 / 4)) * Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = col[2];
    ctx.font = "32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Begin", 440, 450);
    ctx.fillText("Menu", 570, 450);

    ctx.font = "20px monospace";
    if (selX == 0 && selY == 0) {
        ctx.fillText("Allow Rotation", 500, 110);
        ctx.fillText(allowRot == 1 ? "On" : "Off", 500, 150);
    }
    if (selX == 0 && selY == 1) {
        ctx.fillText("Weird Rotation", 500, 110);
        ctx.fillText(weirdRot == 1 ? "On" : "Off", 500, 150);
    }
    if (selX == 2 && selY == 0) {
        ctx.fillText("Asymmetrical Sides", 500, 110);
        ctx.fillText(asymSides == 1 ? "On" : "Off", 500, 150);
    }
    if (selX == 2 && selY == 1) {
        ctx.fillText("Colors", 500, 110);
        ctx.fillText(colN, 500, 150);
    }
    if (selX == 4 && selY == 0) {
        ctx.fillText("Deck Slots", 500, 110);
        ctx.fillText(deckSlots, 500, 150);
    }
    if (selX == 4 && selY == 1) {
        ctx.fillText("Deck Refresh Behavior", 500, 110);
        ctx.fillText("Refresh " + (deckBehavior == 0 ? "All When Empty" : (deckBehavior == 1 ? "Used Slot Only" : "All Slots")), 500, 150);
    }

    timer += 1;
    if (timer == 60) {
        tiles = [];
        for (let f = 0; f < deckSlots; f++) {
            tiles.push(new Tile());
        }
        timer = 0;
    }
    for (let f = 0; f < tiles.length; f++) {
        ctx.fillStyle = col[0];
        ctx.fillRect(Math.round((320 / (tiles.length + 1)) * (f + 1)) + 20, 420, 40, 40);
        displayPos(ctx, tiles[f].pos, Math.round((320 / (tiles.length + 1)) * (f + 1)) + 40, 440, 40, 0);
    }

    if (gameState == "menuC") {
        requestAnimationFrame(drawMenuC);
    }
}

function drawGame() { //////////////////////////////////////////////////////////////////////

}

function drawBG() { /////////////////////////////////////////////////////////////
    ctxBG.clearRect(0, 0, 640, 480);
    ctxBG.fillStyle = col[1];
    ctxBG.fillRect(0, 0, 640, 480); //The background
    ctxBG.fillStyle = col[0];
    ctxBG.fillRect(40, 80, 320, 320);

    ctxBG.font = "16px monospace";
    ctxBG.textAlign = "center";
    ctxBG.fillText("BOARD", 500, 95);
    ctxBG.fillText("HAND", 500, 395);
    
    ctxBG.strokeStyle = col[0];
    ctxBG.lineWidth = 2;
    ctxBG.beginPath();
    ctxBG.moveTo(400, 220);
    ctxBG.lineTo(380, 220);
    ctxBG.lineTo(380, 100);
    ctxBG.lineTo(620, 100);
    ctxBG.lineTo(620, 220);
    ctxBG.lineTo(600, 220);
    ctxBG.stroke();
    ctxBG.beginPath();
    ctxBG.moveTo(400, 260);
    ctxBG.lineTo(380, 260);
    ctxBG.lineTo(380, 380);
    ctxBG.lineTo(620, 380);
    ctxBG.lineTo(620, 260);
    ctxBG.lineTo(600, 260);
    ctxBG.stroke();

    ctxBG.fillRect(520, 420, 100, 40);
    ctxBG.fillStyle = col[2];
    ctxBG.font = "32px monospace";
    ctxBG.fillText("Menu", 570, 450);

    ctxBG.strokeStyle = col[1]; //draws a grid
    ctxBG.lineWidth = 1;
    for (let f = 0; f < 7; f++) {
        ctxBG.beginPath();
        ctxBG.moveTo((40 * f) + 80, 80);
        ctxBG.lineTo((40 * f) + 80, 400);
        ctxBG.stroke();
        ctxBG.beginPath();
        ctxBG.moveTo(40, (40 * f) + 120);
        ctxBG.lineTo(360, (40 * f) + 120);
        ctxBG.stroke();
    }
}

function drawTiles() { ////////////////////////////////////////////////////////////
    ctxML.clearRect(0, 0, 640, 480);
    ctxML.fillStyle = col[2];
    ctxML.font = "16px monospace";
    ctxML.textAlign = "left";
    calcScore();
    ctxML.fillText("Score: " + score, 40, 72); //Draws the score

    ctxML.fillStyle = col[1];
    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctxML.fillRect(m * 40 + 38, n * 40 + 78, 44, 44); //Puts a kind of outline/shadow behind all tiles on the board
            }
        }
    }

    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctxML.fillStyle = col[0];
                ctxML.fillRect(m * 40 + 40, n * 40 + 80, 40, 40); //This draws the white part of a tile
                if (tiles[board[m][n]].stacked != -1) {
                    ctxML.translate(m * 40 + 60, n * 40 + 100);
                    ctxML.strokeStyle = col[1];
                    ctxML.lineWidth = 1;
                    ctxML.strokeRect(-10, -10, 20, 20);
                    ctxML.rotate(Math.PI / 4);
                    ctxML.strokeRect(-10, -10, 20, 20);
                    ctxML.resetTransform();
                }
                tiles[board[m][n]].rPos = calcRPos(board[m][n], tiles[board[m][n]].stacked);
                displayPos(ctxML, tiles[board[m][n]].rPos, m * 40 + 60, n * 40 + 100, 40, 0); //This draws the positions / sides
            }
        }
    }

    for (let f = 0; f < deckSlots; f++) {
        if (deck[f] != -1) { //Draws the deck
            ctxML.fillStyle = col[0];
            ctxML.fillRect(Math.round((320 / (deckSlots + 1)) * (f + 1)) + 20, 420, 40, 40);
            displayPos(ctxML, tiles[deck[f]].pos, Math.round((320 / (deckSlots + 1)) * (f + 1)) + 40, 440, 40, 0);
        } else {
            ctxML.fillStyle = "#AFAFAF"; //The deck slot, if empty, is a gray square
            ctxML.fillRect(Math.round((320 / (deckSlots + 1)) * (f + 1)) + 20, 420, 40, 40);
        }
    }

    if (hand != -1) {
        for (let n = 0; n < 8; n++) {
            for (let m = 0; m < 8; m++) {
                if (!checkCompat(m, n, hand)) { //Draws an X on any space where the currently held tile can't be put down
                    ctxML.lineWidth = 2;
                    ctxML.strokeStyle = "#7F7F7F";
                    ctxML.beginPath();
                    ctxML.moveTo(m * 40 + 40, n * 40 + 80);
                    ctxML.lineTo(m * 40 + 80, n * 40 + 120);
                    ctxML.stroke();
                    ctxML.beginPath();
                    ctxML.moveTo(m * 40 + 80, n * 40 + 80);
                    ctxML.lineTo(m * 40 + 40, n * 40 + 120);
                    ctxML.stroke();
                } else if (checkStackCompat(board[m][n], hand) && tiles[board[m][n]].stacked == -1 && tiles[hand].stacked == -1) {
                    ctxML.lineWidth = 1;
                    ctxML.strokeStyle = col[2];
                    ctxML.strokeRect(m * 40 + 50, n * 40 + 90, 20, 20);
                }
            }
        }
        ctxML.fillStyle = col[0]; //The "inventory" display
        ctxML.fillRect(520, 280, 80, 80);
        if (tiles[hand].stacked != -1) {
            ctxML.beginPath();
            ctxML.moveTo(495, 310);
            ctxML.lineTo(505, 320);
            ctxML.lineTo(495, 330);
            ctxML.fill();
            ctxML.fillRect(400, 280, 80, 80);
            displayPos(ctxML, tiles[tiles[hand].stacked].pos, 440, 320, 80, 0);
        }
        displayPos(ctxML, tiles[hand].pos, 560, 320, 80, 0);
    }
}

function drawCursor() {
    ctxTL.clearRect(0, 0, 640, 480);
    if (selX != -1) { //The moused-over tile
        ctxTL.lineWidth = 1;
        ctxTL.strokeStyle = col[2];
        ctxTL.strokeRect(selX * 40 + 35, selY * 40 + 75, 50, 50);
        if (board[selX][selY] != -1) {
            ctxTL.fillStyle = col[0];
            ctxTL.fillRect(520, 120, 80, 80);
            if (tiles[board[selX][selY]].stacked != -1) {
                ctxTL.beginPath();
                ctxTL.moveTo(495, 150);
                ctxTL.lineTo(505, 160);
                ctxTL.lineTo(495, 170);
                ctxTL.fill();
                ctxTL.fillRect(400, 120, 80, 80);
                displayPos(ctxTL, tiles[tiles[board[selX][selY]].stacked].pos, 440, 160, 80, 0);
                tiles[board[selX][selY]].stacked *= -1;
                if (hand == -1 && checkCompat(selX, selY, board[selX][selY])) {
                    displayKey(ctxTL, "S", 440, 220);
                }
                tiles[board[selX][selY]].stacked *= -1;
            }
            displayPos(ctxTL, tiles[board[selX][selY]].pos, 560, 160, 80, 0);
        }
    }

    if (hand != -1) {
        ctxTL.fillStyle = col[0]; //Draws the currently held tile
        ctxTL.translate(cursorX, cursorY);
        ctxTL.rotate(rAnim);
        ctxTL.fillRect(-25, -25, 50, 50);
        ctxTL.strokeStyle = col[1];
        ctxTL.lineWidth = 1;
        ctxTL.strokeRect(-25, -25, 50, 50);
        if (tiles[hand].stacked != -1) {
            ctxTL.strokeRect(-12, -12, 24, 24);
            ctxTL.rotate(Math.PI / 4);
            ctxTL.strokeRect(-12, -12, 24, 24);
        }
        ctxTL.resetTransform();
        tiles[hand].rPos = calcRPos(hand, tiles[hand].stacked);
        displayPos(ctxTL, tiles[hand].rPos, cursorX, cursorY, 50, rAnim);
        if (Math.abs(rAnim) < 0.1) {
            rAnim = 0;
        }
        rAnim *= 0.6;

        if (selX != -1 && board[selX][selY] != -1) {
            if (checkStackCompat(board[selX][selY], hand)) { //TR
                if (checkCompat(selX, selY, hand) && tiles[hand].stacked == -1 && tiles[board[selX][selY]].stacked == -1) {
                    displayKey(ctxTL, "S", 585, 240);
                }
                displayArrow(ctxTL, 560, 240, 59, 0);
            }
            if (checkStackCompat(hand, board[selX][selY])) {
                displayArrow(ctxTL, 560, 240, 59, Math.PI);
            }
            if (tiles[hand].stacked != -1) { //BL
                if (checkStackCompat(board[selX][selY], tiles[hand].stacked)) {
                    displayArrow(ctxTL, 500, 240, 59, Math.PI / 8);
                }
                if (checkStackCompat(tiles[hand].stacked, board[selX][selY])) {
                    displayArrow(ctxTL, 500, 240, 59, Math.PI / 8 * 9);
                }
            }
            if (tiles[board[selX][selY]].stacked != -1) { //TL
                if (checkStackCompat(tiles[board[selX][selY]].stacked, hand)) {
                    displayArrow(ctxTL, 500, 240, 59, Math.PI / 8 * 15);
                }
                if (checkStackCompat(hand, tiles[board[selX][selY]].stacked)) {
                    displayArrow(ctxTL, 500, 240, 59, Math.PI / 8 * 7);
                }
                if (tiles[hand].stacked != -1) { //BL and TL
                    if (checkStackCompat(tiles[board[selX][selY]].stacked, tiles[hand].stacked)) {
                        displayArrow(ctxTL, 440, 240, 59, 0);
                    }
                    if (checkStackCompat(tiles[hand].stacked, tiles[board[selX][selY]].stacked)) {
                        displayArrow(ctxTL, 440, 240, 59, Math.PI);
                    }
                }
            }
        }
    }

    if (gameState == "game") {
        requestAnimationFrame(drawCursor);
    }
}

init();