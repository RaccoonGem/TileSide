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
let posN = 5;
let boardSize = 320;
let posSize = 8;
let tileSize = 40;
let bOriginX = 40 + ((320 - boardSize) / 2);
let bOriginY = 80 + ((320 - boardSize) / 2);

let deckSlots = 3;
let deckBehavior = 0; //0: no slots refresh until all empty. 1: empty slot refreshes. 2: all slots refresh.

let col = [,,,,,,,,,,]; //The hex values of the game's colors. The first is the color of a tile, the rest are for the sides
col = ["#FFFFFF", "#3F3F3F", "#000000", "#FF0000", "#00BF00", "#0000FF", "#FFDF00", "#00FFFF", "#FF00FF", "#FF7F00", "#7F00FF"];
let colScheme = 0;
let colSchemeName = ["Default", "Graph Paper", "Geothermal"];

let boardN = 8;
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
    this.pos = []; //A position being "0" means it's blank
    for (let  f = 0; f < posN * 4; f++) {
        this.pos.push(0);
    }
    this.stacked = -1; //The tile stacked on top of this one. -1 means no tile
    let sideCol = [];
    for (let f = 0; f < 4; f++) {
        sideCol.push(Math.ceil(Math.random() * colN) + 1);
    }
    
    if (asymSides == 0) {
        for (let f = 0; f < 4; f++) {
            while (this.pos.slice(f * posN, (f + 1) * posN).every(p => p == 0)) {
                for (let g = 0; g < posN; g++) {
                    this.pos[g + (f * posN)] = ((g < posN / 2) ? (Math.round(Math.random()) * sideCol[f]) : (this.pos[(posN - g - 1) + (f * posN)]));
                }
                if (((this.pos.at(f * posN - 1) && this.pos[f * posN]) && (this.pos.at(f * posN - 1) != this.pos[f * posN]))
                || ((this.pos[((f + 1) * posN) % (posN * 4)] && this.pos[(f + 1) * posN - 1]) && (this.pos[((f + 1) * posN) % (posN * 4)] != this.pos[(f + 1) * posN - 1]))) {
                    this.pos[f * posN] = 0;
                    this.pos[(f + 1) * posN - 1] = 0;
                }
            }
        }
    }
    else {
        for (let f = 0; f < 4; f++) {
            while (this.pos.slice(f * posN, (f + 1) * posN).every(p => p == 0)) {
                for (let g = 0; g < posN; g++) {
                    this.pos[g + (f * posN)] = Math.round(Math.random()) * sideCol[f];
                }
                if ((this.pos.at(f * posN - 1) && this.pos[f * posN]) && (this.pos.at(f * posN - 1) != this.pos[f * posN])) {
                    this.pos[f * posN] = 0;
                }
                if ((this.pos[((f + 1) * posN) % (posN * 4)] && this.pos[(f + 1) * posN - 1]) && (this.pos[((f + 1) * posN) % (posN * 4)] != this.pos[(f + 1) * posN - 1])) {
                    this.pos[(f + 1) * posN - 1] = 0;
                }
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
    posN = 5;
    evalSizes();

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
    result.length = posN * 4;
    if (Math.sign(t1) == -1 || Math.sign(t2) == -1) {
        return Math.sign(t1) == -1 ? tiles[t2].pos : tiles[t1].pos;
    }
    for (let f = 0; f < posN * 4; f++) {
        result[f] = tiles[t2].pos[f] || tiles[t1].pos[f];
    }
    return result; //returns what the positions would be if t2 were stacked on top of t1
}

function match(p) {
    return (p + (3 * posN - 1) - (2 * (p % posN))) % (posN * 4);
}

function checkSide(t1, t2, s) { //t1 and t2 are the numbers of the two tiles being checked against each other
    s *= posN; //s is passed in as either 0, 1, 2, or 3, depending on the side of t1 being checked against (0 is the top, goes around clockwise)
    let scoreToAdd = 0; //If the two tiles are deemed compatible, scr will be returned as the point value of their union
    if (t1 == -1 || t2 == -1) {
        return 0; //If either t1 or t2 is actually -1, meaning it's no tile at all, simply return 0
    }
    let uT = Math.sign(tiles[t1].stacked) != -1 ? tiles[t1].rPos : tiles[t1].pos;
    for (let S = s; S < s + posN; S++) {
        if (uT[S] * tiles[t2].rPos[match(S)] != 0) {
            if (uT[S] != tiles[t2].rPos[match(S)]) {
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
    for (let f = 0; f < posN * 4; f++) {
        if (rT[f] * rT.at(f - 1) != 0 && rT[f] != rT.at(f - 1)) {
            return false;
        }
        if (rT[f] * rT[(f + 1) % (posN * 4)] != 0 && rT[f] != rT[(f + 1) % (posN * 4)]) {
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
            if (deck.some(tile => tile != -1)) break;
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
            if (deck.every(tile => tile != -1)) break;
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

function evalSizes() {
    posSize = Math.floor(336 / (boardN * posN));
    tileSize = posSize * posN;
    boardSize = tileSize * boardN;
    bOriginX = 40 + ((320 - boardSize) / 2);
    bOriginY = 80 + ((320 - boardSize) / 2);
}

function rotateCW() {
    for (let f = (weirdRot == 1 ? (posN - 1) : 0); f < posN; f++) {
        tiles[hand].pos.unshift(tiles[hand].pos.pop());
    }
    if (weirdRot == 0) {
        rAnim -= Math.PI / 2;
    }
    if (tiles[hand].stacked != -1) {
        for (let f = (weirdRot == 1 ? (posN - 1) : 0); f < posN; f++) {
            tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos.pop());
        }
        tiles[hand].rPos = calcRPos(hand, tiles[hand].stacked);
    }
}

function rotateCCW() {
    for (let f = (weirdRot == 1 ? (posN - 1) : 0); f < posN; f++) {
        tiles[hand].pos.push(tiles[hand].pos.shift());
    }
    if (weirdRot == 0) {
        rAnim += Math.PI / 2;
    }
    if (tiles[hand].stacked != -1) {
        for (let f = (weirdRot == 1 ? (posN - 1) : 0); f < posN; f++) {
            tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
        }
        tiles[hand].rPos = calcRPos(hand, tiles[hand].stacked);
    }
}

function stack() {
    if (checkStackCompat(board[selX][selY], hand) && checkCompat(selX, selY, hand)) {
        tiles[board[selX][selY]].stacked = hand;
        tiles[board[selX][selY]].rPos = calcRPos(board[selX][selY], tiles[board[selX][selY]].stacked);
        hand = -1;
        refreshDeck(); //refresh the deck if it needs it upon stacking a tile successfully
    }
}

function unstack() {
    hand = tiles[board[selX][selY]].stacked;
    tiles[board[selX][selY]].stacked = -1;
    tiles[board[selX][selY]].rPos = calcRPos(board[selX][selY], tiles[board[selX][selY]].stacked);
    if (!checkCompat(selX, selY, board[selX][selY])) {
        tiles[board[selX][selY]].stacked = hand;
        tiles[board[selX][selY]].rPos = calcRPos(board[selX][selY], tiles[board[selX][selY]].stacked);
        hand = -1;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function displayPos(c, t, x, y, s, r) { //parameters are Canvas, Tile (an array of its 20 positions), X and Y coordinates, Size, and Rotation
    c.resetTransform();
    c.translate(x, y);
    c.scale(s / (posN * 2), s / (posN * 2));
    c.rotate(r);
    for (let p = 0; p < (posN * 4); p++) {
        if (t[p] == 0) {
            if (p % posN == posN - 1) {
                c.rotate(Math.PI / 2);
            }
            continue;
        }
        c.fillStyle = col[t[p]];
        switch (p % posN) {
            case 0:
                if (t.at(p - 1) == t[p]) {
                    c.fillRect(-posN, -posN, 2, 2);
                } else {
                    c.beginPath();
                    c.moveTo(-posN, -posN);
                    c.lineTo(-posN + 2, -posN);
                    c.lineTo(-posN + 2, -posN + 2);
                    c.fill();
                }
                break;
            case (posN - 1):
                if (t[(p + 1) % (posN * 4)] != t[p]) {
                    c.beginPath();
                    c.moveTo(posN - 2, -posN);
                    c.lineTo(posN, -posN);
                    c.lineTo(posN - 2, -posN + 2);
                    c.fill();
                }
                c.rotate(Math.PI / 2);
                break;
            default:
                c.fillRect(-posN + ((p % posN) * 2), -posN, 2, 2);
        }
    }
    c.resetTransform();
}

function displayKey(c, key, x, y) { //Draws an icon on context c depicting a key at (x, y)
    c.resetTransform();
    c.translate(x, y);
    c.strokeStyle = col[1];
    c.strokeRect(-10, -10, 20, 20);
    c.fillStyle = col[1];
    c.font = "16px monospace";
    c.textAlign = "center";
    c.fillText(key, 0, 6);
    c.resetTransform();
}

function displayArrow(c, x, y, l, r) { //Draws an arrow on context c with a center of (x, y), a length of l, and a rotation of r radians (starts pointing up, goes clockwise)
    c.resetTransform();
    c.fillStyle = col[1];
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
            rotateCCW();
            drawTiles();
        }

        if (keyName === 'd' && hand != -1) {
            rotateCW();
            drawTiles();
        }

        if (keyName === 's') {
            if (tiles[board[selX][selY]].stacked == -1 && hand != -1 && tiles[hand].stacked == -1) {
                stack();
            } else if (tiles[board[selX][selY]].stacked != -1 && hand == -1) {
                unstack();
            }
            drawTiles();
        }
    }
}, false);

canvasTL.addEventListener('mousemove', (event) => { //tracks mouse movement, does the math for what's selected
    cursorX = event.offsetX;
    cursorY = event.offsetY;
    selX = (gameState == "menuC" ? Math.floor((cursorX - 40) / 40) : Math.floor((cursorX - bOriginX) / tileSize));
    selY = (gameState == "menuC" ? Math.floor((cursorY - 80) / 40) : Math.floor((cursorY - bOriginY) / tileSize));
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
            if (pointInArea(cursorX, cursorY, Math.round((320 / (deckSlots + 1)) * (f + 1)) + (tileSize / 2), 420, tileSize, tileSize)) {
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
                    col = ["#FFFFFF", "#3F3F3F", "#000000", "#FF0000", "#00BF00", "#0000FF", "#FFDF00", "#00FFFF", "#FF00FF", "#FF7F00", "#7F00FF"];
                    break;
                case 1:
                    col = ["#FFF7DF", "#000000", "#000000", "#005FFF", "#FF0000", "#00BF00", "#7F7F7F", "#00009F", "#8F0000", "#007F00", "#FF00FF"];
                    break;
                case 2:
                    col = ["#00007F", "#BFBFBF", "#FFFFFF", "#FFDF00", "#FF7F00", "#FF0000", "#BFBFBF", "#00FFFF", "#0000FF", "#FF00FF", "#00FF00"];
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
            posN = ((posN - 2) % 6) + 3;
            evalSizes();
        }
        if (selX == 2 && selY == 1) {
            asymSides = 1 - asymSides;
        }
        if (selX == 2 && selY == 2) {
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
            tiles = [];
            for (let f = 0; f < deckSlots; f++) {
                tiles.push(new Tile());
            }
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

    ctx.fillStyle = col[0];
    ctx.fillRect(0, 0, 640, 480); //The background

    ctx.strokeStyle = col[1];
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 80, 200, 80);
    if (gameStarted) {
        ctx.strokeRect(400, 200, 200, 60);
    }
    ctx.strokeRect(400, 400, 200, 60);
    ctx.strokeRect(20, 420, 40, 40);

    for (let f = 0; f < colN; f++) {
        ctx.fillStyle = col[f + 2];
        ctx.beginPath();
        ctx.moveTo(40, 440);
        ctx.arc(40, 440, 15, ((f / colN) - (1 / 4)) * Math.PI * 2, (((f + 1) / colN) - (1 / 4)) * Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = col[1];
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

    ctx.fillStyle = col[0];
    ctx.fillRect(0, 0, 640, 480); //The background
    ctx.strokeStyle = col[1];
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 80, 320, 320);

    ctx.strokeRect(380, 420, 120, 40);
    ctx.strokeRect(520, 420, 100, 40);

    ctx.lineWidth = 1;
    for (let f = 0; f < 7; f++) { //draws a grid
        ctx.beginPath();
        ctx.moveTo((40 * f) + 80, 80);
        ctx.lineTo((40 * f) + 80, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40, (40 * f) + 120);
        ctx.lineTo(360, (40 * f) + 120);
        ctx.stroke();
    }

    ctx.fillStyle = col[1];
    ctx.beginPath();
    ctx.arc(60, 100, 15, 0, Math.PI * 2);
    allowRot == 1 ? ctx.fill() : ctx.stroke();
    ctx.beginPath();
    ctx.arc(60, 140, 15, 0, Math.PI * 2);
    weirdRot == 1 ? ctx.fill() : ctx.stroke();
    ctx.beginPath();
    ctx.arc(140, 100, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(140, 140, 15, 0, Math.PI * 2);
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
        ctx.moveTo(140, 180);
        ctx.arc(140, 180, 15, ((f / colN) - (1 / 4)) * Math.PI * 2, (((f + 1) / colN) - (1 / 4)) * Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = col[1];
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
        ctx.fillText("Positions per Side", 500, 110);
        ctx.fillText(posN, 500, 150);
    }
    if (selX == 2 && selY == 1) {
        ctx.fillText("Asymmetrical Sides", 500, 110);
        ctx.fillText(asymSides == 1 ? "On" : "Off", 500, 150);
    }
    if (selX == 2 && selY == 2) {
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
    for (let f = 0; f < deckSlots; f++) { //Draws the deck of sample tiles
        ctx.strokeStyle = col[1];
        ctx.strokeRect(Math.round((320 / (deckSlots + 1)) * (f + 1)) + 39 - (tileSize / 2), 439 - (tileSize / 2), tileSize + 2, tileSize + 2);
        displayPos(ctx, tiles[f].pos, Math.round((320 / (deckSlots + 1)) * (f + 1)) + 40, 440, tileSize, 0);
    }

    if (gameState == "menuC") {
        requestAnimationFrame(drawMenuC);
    }
}

function drawBG() { /////////////////////////////////////////////////////////////
    ctxBG.clearRect(0, 0, 640, 480);
    ctxBG.fillStyle = col[0];
    ctxBG.fillRect(0, 0, 640, 480); //The background

    ctxBG.strokeStyle = col[1];
    ctxBG.lineWidth = 2;

    ctxBG.fillStyle = col[1];
    ctxBG.font = "16px monospace";
    ctxBG.textAlign = "center";
    ctxBG.fillText("BOARD", 500, 95);
    ctxBG.fillText("HAND", 500, 395);
    
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

    ctxBG.strokeRect(520, 420, 100, 40);
    ctxBG.font = "32px monospace";
    ctxBG.fillText("Menu", 570, 450);

    ctxBG.strokeRect(bOriginX, bOriginY, boardSize, boardSize);
    ctxBG.lineWidth = 1;
    for (let f = 0; f < boardN - 1; f++) { //draws a grid
        ctxBG.beginPath();
        ctxBG.moveTo(bOriginX + ((f + 1) * tileSize), bOriginY);
        ctxBG.lineTo(bOriginX + ((f + 1) * tileSize), bOriginY + boardSize);
        ctxBG.stroke();
        ctxBG.beginPath();
        ctxBG.moveTo(bOriginX, bOriginY + ((f + 1) * tileSize));
        ctxBG.lineTo(bOriginX + boardSize, bOriginY + ((f + 1) * tileSize));
        ctxBG.stroke();
    }
}

function drawTiles() { ////////////////////////////////////////////////////////////
    ctxML.clearRect(0, 0, 640, 480);

    ctxML.strokeStyle = col[1];
    ctxML.lineWidth = 1;

    ctxML.fillStyle = col[1];
    ctxML.font = "16px monospace";
    ctxML.textAlign = "left";
    calcScore();
    ctxML.fillText("Score: " + score, bOriginX, bOriginY - 8); //Draws the score

    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctxML.fillRect(m * tileSize + bOriginX - 2, n * tileSize + bOriginY - 2, tileSize + 4, tileSize + 4); //Puts a kind of outline/shadow behind all tiles on the board
            }
        }
    }

    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctxML.fillStyle = col[0];
                ctxML.fillRect(m * tileSize + bOriginX, n * tileSize + bOriginY, tileSize, tileSize); //This draws the white part of a tile
                if (tiles[board[m][n]].stacked != -1) {
                    ctxML.translate((m + 0.5) * tileSize + bOriginX, (n + 0.5) * tileSize + bOriginY);
                    ctxML.strokeStyle = col[1];
                    ctxML.lineWidth = 1;
                    ctxML.strokeRect(-tileSize / 4, -tileSize / 4, tileSize / 2, tileSize / 2);
                    ctxML.rotate(Math.PI / 4);
                    ctxML.strokeRect(-tileSize / 4, -tileSize / 4, tileSize / 2, tileSize / 2);
                    ctxML.resetTransform();
                }
                displayPos(ctxML, tiles[board[m][n]].rPos, (m + 0.5) * tileSize + bOriginX, (n + 0.5) * tileSize + bOriginY, tileSize, 0); //This draws the positions / sides
            }
        }
    }

    for (let f = 0; f < deckSlots; f++) {
        if (deck[f] != -1) { //Draws the deck
            ctxML.strokeStyle = col[1];
            ctxML.strokeRect(Math.round((320 / (deckSlots + 1)) * (f + 1)) + 39 - (tileSize / 2), 439 - (tileSize / 2), tileSize + 2, tileSize + 2);
            displayPos(ctxML, tiles[deck[f]].pos, Math.round((320 / (deckSlots + 1)) * (f + 1)) + 40, 440, tileSize, 0);
        } else {
            ctxML.fillStyle = col[1]; //The deck slot, if empty, is a gray square
            ctxML.fillRect(Math.round((320 / (deckSlots + 1)) * (f + 1)) + 40 - (tileSize / 2), 440 - (tileSize / 2), tileSize, tileSize);
        }
    }

    if (hand != -1) {
        for (let n = 0; n < 8; n++) {
            for (let m = 0; m < 8; m++) {
                if (!checkCompat(m, n, hand)) { //Draws an X on any space where the currently held tile can't be put down
                    ctxML.lineWidth = 2;
                    ctxML.strokeStyle = col[1];
                    ctxML.beginPath();
                    ctxML.moveTo(m * tileSize + bOriginX, n * tileSize + bOriginY);
                    ctxML.lineTo((m + 1) * tileSize + bOriginX, (n + 1) * tileSize + bOriginY);
                    ctxML.stroke();
                    ctxML.beginPath();
                    ctxML.moveTo((m + 1) * tileSize + bOriginX, n * tileSize + bOriginY);
                    ctxML.lineTo(m * tileSize + bOriginX, (n + 1) * tileSize + bOriginY);
                    ctxML.stroke();
                } else if (checkStackCompat(board[m][n], hand) && tiles[board[m][n]].stacked == -1 && tiles[hand].stacked == -1) {
                    ctxML.lineWidth = 1;
                    ctxML.strokeStyle = col[2];
                    ctxML.strokeRect((m + 0.25) * tileSize + bOriginX, (n + 0.25) * tileSize + bOriginY, tileSize / 2, tileSize / 2);
                }
            }
        }

        ctxML.strokeRect(560 - tileSize, 320 - tileSize, tileSize * 2, tileSize * 2); //The "inventory" display
        if (tiles[hand].stacked != -1) {
            ctxML.beginPath();
            ctxML.moveTo(495, 310);
            ctxML.lineTo(505, 320);
            ctxML.lineTo(495, 330);
            ctxML.stroke();
            ctxML.strokeRect(440 - tileSize, 320 - tileSize, tileSize * 2, tileSize * 2);
            displayPos(ctxML, tiles[tiles[hand].stacked].pos, 440, 320, tileSize * 2, 0);
        }
        displayPos(ctxML, tiles[hand].pos, 560, 320, tileSize * 2, 0);
    }
}

function drawCursor() {
    ctxTL.clearRect(0, 0, 640, 480);
    if (selX != -1) { //The moused-over tile
        ctxTL.lineWidth = 1;
        ctxTL.strokeStyle = col[2];
        ctxTL.strokeRect(selX * tileSize + bOriginX - 5, selY * tileSize + bOriginY - 5, tileSize + 10, tileSize + 10);
        if (board[selX][selY] != -1) {
            ctxTL.strokeStyle = col[1];
            ctxTL.strokeRect(560 - tileSize, 160 - tileSize, tileSize * 2, tileSize * 2);
            if (tiles[board[selX][selY]].stacked != -1) {
                ctxTL.beginPath();
                ctxTL.moveTo(495, 150);
                ctxTL.lineTo(505, 160);
                ctxTL.lineTo(495, 170);
                ctxTL.stroke();
                ctxTL.strokeRect(440 - tileSize, 160 - tileSize, tileSize * 2, tileSize * 2);
                displayPos(ctxTL, tiles[tiles[board[selX][selY]].stacked].pos, 440, 160, tileSize * 2, 0);
                tiles[board[selX][selY]].stacked *= -1;
                if (hand == -1 && checkCompat(selX, selY, board[selX][selY])) {
                    displayKey(ctxTL, "S", 440, 220);
                }
                tiles[board[selX][selY]].stacked *= -1;
            }
            displayPos(ctxTL, tiles[board[selX][selY]].pos, 560, 160, tileSize * 2, 0);
        }
    }

    if (hand != -1) {
        ctxTL.fillStyle = col[0]; //Draws the currently held tile
        ctxTL.translate(cursorX, cursorY);
        ctxTL.rotate(rAnim);
        ctxTL.fillRect((-tileSize / 2) - posN, (-tileSize / 2) - posN, tileSize + (posN * 2), tileSize + (posN * 2));
        ctxTL.strokeStyle = col[1];
        ctxTL.lineWidth = 1;
        ctxTL.strokeRect((-tileSize / 2) - posN - 1, (-tileSize / 2) - posN - 1, tileSize + (posN * 2) + 2, tileSize + (posN * 2) + 2);
        if (tiles[hand].stacked != -1) {
            ctxTL.scale(0.5, 0.5);
            ctxTL.strokeRect((-tileSize / 2) - posN, (-tileSize / 2) - posN, tileSize + (posN * 2), tileSize + (posN * 2));
            ctxTL.rotate(Math.PI / 4);
            ctxTL.strokeRect((-tileSize / 2) - posN, (-tileSize / 2) - posN, tileSize + (posN * 2), tileSize + (posN * 2));
        }
        ctxTL.resetTransform();
        displayPos(ctxTL, tiles[hand].rPos, cursorX, cursorY, tileSize + (posN * 2), rAnim);
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