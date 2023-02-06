const canvas = document.getElementById("canvas");

let cursorX = 0; //The position of the mouse when it's on the canvas
let cursorY = 0;
let selX = -1; //The coordinates of the square on the board that the mouse is hovering over
let selY = -1; //(both will be -1 when it's off the board)
let hand = -1; //The number of the tile being held by the player (-1 if they aren't holding one)
let deck = [1, 2, 3]; //The number of each tile in the three slots at the bottom
let score = 0;
let rAnim = 0;

let col = ["#FFFFFF", "#BFBFBF", "#000000", "#FF0000", "#00BF00", "#0000FF"]; //The hex values of the game's colors. The first is the color of a tile, the rest are for the sides
//col.push("#FFDF00");
let colN = col.length - 2; //The number of colors for tile sides to choose from
let board = [
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
    [,,,,,,,],
]; //The board, a 2D array, where each spot is the number of the tile that sits there, or -1 for no tile
for (let n = 0; n < 8; n++) { //Makes it so each spot on the board array is -1 / empty
    for (let m = 0; m < 8; m++) {
        board[m][n] = -1;
    }
}

let tiles = []; //The array which stores each tile that is created

function Tile () { //Constructor for tiles. The parameters are what color each side will be, and then the 12 positions are randomized
    this.pos = [0,0,0,0,0,0,0,0,0,0,0,0]; //A position being "0" means it's blank
    this.stacked = -1; //The tile stacked on top of this one. -1 means no tile
    let north = Math.ceil(Math.random() * colN) + 1;
    let east = Math.ceil(Math.random() * colN) + 1;
    let south = Math.ceil(Math.random() * colN) + 1;
    let west = Math.ceil(Math.random() * colN) + 1;
    while (this.pos[0] + this.pos[1] + this.pos[2] == 0) {
        this.pos[0] = Math.round(Math.random()) * north;
        this.pos[1] = Math.round(Math.random()) * north;
        this.pos[2] = Math.round(Math.random()) * north;
    }
    while (this.pos[3] + this.pos[4] + this.pos[5] == 0) {
        this.pos[3] = Math.round(Math.random()) * east;
        this.pos[4] = Math.round(Math.random()) * east;
        this.pos[5] = Math.round(Math.random()) * east;
        if (this.pos[0] != 0 && this.pos[0] != this.pos[3]) {
            this.pos[3] = 0;
        }
    }
    while (this.pos[6] + this.pos[7] + this.pos[8] == 0) {
        this.pos[6] = Math.round(Math.random()) * south;
        this.pos[7] = Math.round(Math.random()) * south;
        this.pos[8] = Math.round(Math.random()) * south;
        if (this.pos[3] != 0 && this.pos[3] != this.pos[6]) {
            this.pos[6] = 0;
        }
    }
    while (this.pos[9] + this.pos[10] + this.pos[11] == 0) {
        this.pos[9] = Math.round(Math.random()) * west;
        this.pos[10] = Math.round(Math.random()) * west;
        this.pos[11] = Math.round(Math.random()) * west;
        if (this.pos[6] + this.pos[0] != 0 && (this.pos[6] != this.pos[9] || this.pos[0] != this.pos[9])) {
            this.pos[9] = 0;
        }
    }
    this.rPos = this.pos; //"real position" or "read position", what to read for stacked tiles
}

tiles[0] = new Tile(); //Creates the opening set of tiles in the deck, as well as the one on the board
tiles.push(new Tile());
tiles.push(new Tile());
tiles.push(new Tile());
board[4][3] = 0; //Places the first tile

function calcRPos(t1, t2) { //t1 is stacked onto, t2 is on top
    let result = [];
    result.length = 12;
    if (Math.sign(t1) == -1 || Math.sign(t2) == -1) {
        return Math.sign(t1) == -1 ? tiles[t2].pos : tiles[t1].pos;
    }
    for (f = 0; f < 12; f++) {
        result[f] = tiles[t2].pos[f] || tiles[t1].pos[f];
    }
    return result; //returns what the positions would be if t2 were stacked on top of t1
}

function checkSide(t1, t2, s) { //t1 and t2 are the numbers of the two tiles being checked against each other
    s *= 3; //s is passed in as either 0, 1, 2, or 3, depending on the side of t1 being checked against (0 is the top, goes around clockwise)
    let scoreToAdd = 0; //If the two tiles are deemed compatible, scr will be returned as the point value of their union
    if (t1 == -1 || t2 == -1) {
        return 0; //If either t1 or t2 is actually -1, meaning it's no tile at all, simply return 0
    }
    tiles[t1].rPos = calcRPos(t1, tiles[t1].stacked);
    tiles[t2].rPos = calcRPos(t2, tiles[t2].stacked);
    if (tiles[t1].rPos[s] * tiles[t2].rPos[(s + 6) % 12] != 0) {
        if (tiles[t1].rPos[s] != tiles[t2].rPos[(s + 6) % 12]) {
            return -1; //If they are not compatible, -1 will be returned instead.
        }
        else {
            scoreToAdd += 2;
        }
    }
    if (tiles[t1].rPos[s + 1] * tiles[t2].rPos[(s + 7) % 12] != 0) {
        if (tiles[t1].rPos[s + 1] != tiles[t2].rPos[(s + 7) % 12]) {
            return -1;
        }
        else {
            scoreToAdd += 2;
        }
    }
    if (tiles[t1].rPos[s + 2] * tiles[t2].rPos[(s + 8) % 12] != 0) {
        if (tiles[t1].rPos[s + 2] != tiles[t2].rPos[(s + 8) % 12]) {
            return -1;
        }
        else {
            scoreToAdd += 1;
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
    for (let f = 0; f < 12; f++) {
        if (f % 3 == 0) {
            if (rT[f] * rT[(f + 9) % 12] != 0 && rT[f] != rT[(f + 9) % 12]) {
                return false;
            }
            if (rT[f] * rT[(f + 3) % 12] != 0 && rT[f] != rT[(f + 3) % 12]) {
                return false;
            }
        }
        else if ((f - 1) % 3 == 0) {
            if (rT[f] * rT[f - 1] != 0 && rT[f] != rT[f - 1]) {
                return false;
            }
            if (rT[f] * rT[f + 1] != 0 && rT[f] != rT[f + 1]) {
                return false;
            }
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

function displayPos(c, t, x, y, s, r) { //parameters are Canvas, Tile (an array of its 12 positions), X and Y coordinates, Size, and Rotation
    c.resetTransform();
    c.translate(x, y);
    c.scale(s / 10, s / 10);
    c.rotate(r);
    for (let p = 0; p < 12; p++) {
        if (t[p] == 0) {
            if (p % 3 == 2) {
                c.rotate(Math.PI / 2);
            }
            continue;
        }
        c.fillStyle = col[t[p]];
        c.strokeStyle = col[t[p]];
        switch (p % 3) {
            case 0:
                if (t[(p + 9) % 12] == t[p]) {
                    c.fillRect(-5, -5, 2, 2);
                }
                else {
                    c.beginPath();
                    c.moveTo(-5, -5);
                    c.lineTo(-3, -5);
                    c.lineTo(-3, -3);
                    c.fill();
                }
                if (t[(p + 3) % 12] != t[p]) {
                    c.beginPath();
                    c.moveTo(3, -5);
                    c.lineTo(5, -5);
                    c.lineTo(3, -3);
                    c.fill();
                }
                break;
            case 1:
                c.fillRect(-3, -5, 2, 2);
                c.fillRect(1, -5, 2, 2);
                break;
            case 2:
                c.fillRect(-1, -5, 2, 2);
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

document.addEventListener('keydown', (event) => { //Key presses, for rotating and stacking tiles
    const keyName = event.key.toLowerCase();
    if (keyName === 'a') {
        if (hand != -1) {
            tiles[hand].pos.push(tiles[hand].pos.shift());
            tiles[hand].pos.push(tiles[hand].pos.shift());
            tiles[hand].pos.push(tiles[hand].pos.shift());
            tiles[hand].pos.length = 12;
            rAnim += Math.PI / 2;
            if (tiles[hand].stacked != -1) {
                tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                tiles[tiles[hand].stacked].pos.push(tiles[tiles[hand].stacked].pos.shift());
                tiles[tiles[hand].stacked].pos.length = 12;
            }
        }
    }
    if (keyName === 'd') {
        if (hand != -1) {
            tiles[hand].pos.unshift(tiles[hand].pos[11]);
            tiles[hand].pos.unshift(tiles[hand].pos[11]);
            tiles[hand].pos.unshift(tiles[hand].pos[11]);
            tiles[hand].pos.length = 12;
            rAnim -= Math.PI / 2;
            if (tiles[hand].stacked != -1) {
                tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[11]);
                tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[11]);
                tiles[tiles[hand].stacked].pos.unshift(tiles[tiles[hand].stacked].pos[11]);
                tiles[hand].pos.length = 12;
            }
        }
    }
    if (keyName === 's') {
        if (tiles[board[selX][selY]].stacked == -1 && hand != -1 && tiles[hand].stacked == -1) {
            if (checkStackCompat(board[selX][selY], hand) && checkCompat(selX, selY, hand)) {
                tiles[board[selX][selY]].stacked = hand;
                hand = -1;
                for (let d = 0; d < 3; d++) { //refresh the deck if it needs it upon stacking a tile successfully
                    if (deck[d] == -1) {
                        deck[d] = tiles.length;
                        tiles.push(new Tile());
                    }
                }
            }
        }
        else if (tiles[board[selX][selY]].stacked != -1 && hand == -1) {
            hand = tiles[board[selX][selY]].stacked;
            tiles[board[selX][selY]].stacked = -1;
            if (!checkCompat(selX, selY, board[selX][selY])) {
                tiles[board[selX][selY]].stacked = hand;
                hand = -1;
            }
        }
    }
}, false);

canvas.addEventListener('mousemove', (event) => { //tracks mouse movement, does the math for what's selected
    cursorX = event.offsetX;
    cursorY = event.offsetY;
    selX = Math.round((cursorX - 60) / 40);
    selY = Math.round((cursorY - 100) / 40);
    if (selX < 0 || selX >= 8 || selY < 0 || selY >= 8) {
        selX = -1;
        selY = -1;
    }
}, false);

canvas.addEventListener('click', (event) => {
    if (selX != -1) {
        if (checkCompat(selX, selY, hand)) { //swapping / picking up / putting down tiles
            hand += board[selX][selY];
            board[selX][selY] = hand - board[selX][selY];
            hand -= board[selX][selY];
            for (let d = 0; d < 3; d++) { //refresh the deck if it needs it upon placing a tile successfully
                if (deck[d] == -1) {
                    deck[d] = tiles.length;
                    tiles.push(new Tile());
                }
            }
        }
    }
    if (cursorY >= 420 && cursorY <= 460) { //the deck
        if (cursorX >= 90 && cursorX <= 130) {
            if (hand == -1) {
                hand = deck[0];
                deck[0] = -1;
            }
            else if (deck[0] == -1) {
                deck[0] = hand;
                hand = -1;
            }
        }
        if (cursorX >= 180 && cursorX <= 220) {
            if (hand == -1) {
                hand = deck[1];
                deck[1] = -1;
            }
            else if (deck[1] == -1) {
                deck[1] = hand;
                hand = -1;
            }
        }
        if (cursorX >= 270 && cursorX <= 310) {
            if (hand == -1) {
                hand = deck[2];
                deck[2] = -1;
            }
            else if (deck[2] == -1) {
                deck[2] = hand;
                hand = -1;
            }
        }
    }
}, false);

function init() { //starts things up
    window.requestAnimationFrame(draw);
}

function draw() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 640, 480);

    ctx.fillStyle = col[1];
    ctx.fillRect(0, 0, 640, 480); //The background
    ctx.fillStyle = col[0];
    ctx.fillRect(40, 80, 320, 320);

    ctx.fillStyle = col[2];
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    calcScore();
    ctx.fillText("Score: " + score, 40, 72); //Draws the score
    
    ctx.strokeStyle = col[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 220);
    ctx.lineTo(380, 220);
    ctx.lineTo(380, 100);
    ctx.lineTo(620, 100);
    ctx.lineTo(620, 220);
    ctx.lineTo(600, 220);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(400, 260);
    ctx.lineTo(380, 260);
    ctx.lineTo(380, 380);
    ctx.lineTo(620, 380);
    ctx.lineTo(620, 260);
    ctx.lineTo(600, 260);
    ctx.stroke();

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

    ctx.fillStyle = col[1];
    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctx.fillRect(m * 40 + 38, n * 40 + 78, 44, 44); //Puts a kind of outline/shadow behind all tiles on the board
            }
        }
    }

    for (let n = 0; n < 8; n++) {
        for (let m = 0; m < 8; m++) {
            if (board[m][n] != -1) {
                ctx.fillStyle = col[0];
                ctx.fillRect(m * 40 + 40, n * 40 + 80, 40, 40); //This draws the white part of a tile
                if (tiles[board[m][n]].stacked != -1) {
                    ctx.strokeStyle = col[1];
                    ctx.lineWidth = 2;
                    ctx.strokeRect(m * 40 + 50, n * 40 + 90, 20, 20);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(m * 40 + 45, n * 40 + 85, 30, 30);
                }
                tiles[board[m][n]].rPos = calcRPos(board[m][n], tiles[board[m][n]].stacked);
                displayPos(ctx, tiles[board[m][n]].rPos, m * 40 + 60, n * 40 + 100, 40, 0); //This draws the positions / sides
            }
        }
    }

    if (selX != -1) { //The moused-over tile
        ctx.lineWidth = 1;
        ctx.strokeStyle = col[2];
        ctx.strokeRect(selX * 40 + 35, selY * 40 + 75, 50, 50);
        if (board[selX][selY] != -1) {
            ctx.fillStyle = col[0];
            ctx.fillRect(520, 120, 80, 80);
            if (tiles[board[selX][selY]].stacked != -1) {
                ctx.beginPath();
                ctx.moveTo(495, 150);
                ctx.lineTo(505, 160);
                ctx.lineTo(495, 170);
                ctx.fill();
                ctx.fillRect(400, 120, 80, 80);
                displayPos(ctx, tiles[tiles[board[selX][selY]].stacked].pos, 440, 160, 80, 0);
                tiles[board[selX][selY]].stacked *= -1;
                if (hand == -1 && checkCompat(selX, selY, board[selX][selY])) {
                    displayKey(ctx, "S", 440, 220);
                }
                tiles[board[selX][selY]].stacked *= -1;
            }
            displayPos(ctx, tiles[board[selX][selY]].pos, 560, 160, 80, 0);
        }
    }

    for (let f = 0; f < 3; f++) {
        if (deck[f] != -1) { //Draws the deck
            ctx.fillStyle = col[0];
            ctx.fillRect((f + 1) * 90, 420, 40, 40);
            displayPos(ctx, tiles[deck[f]].pos, (f + 1) * 90 + 20, 440, 40, 0);
        }
        else {
            ctx.fillStyle = "#AFAFAF"; //The deck slot, if empty, is a gray square
            ctx.fillRect((f + 1) * 90, 420, 40, 40);
        }
    }

    if (hand != -1) {
        for (let n = 0; n < 8; n++) {
            for (let m = 0; m < 8; m++) {
                if (!checkCompat(m, n, hand)) { //Draws a block on any space where the currently held tile can't be put down
                    ctx.fillStyle = "#7F7F7F";
                    ctx.fillRect(m * 40 + 50, n * 40 + 90, 20, 20);
                }
                else if (checkStackCompat(board[m][n], hand) && tiles[board[m][n]].stacked == -1 && tiles[hand].stacked == -1) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = col[2];
                    ctx.strokeRect(m * 40 + 50, n * 40 + 90, 20, 20);
                }
            }
        }
        ctx.fillStyle = col[0]; //Draws the currently held tile
        ctx.translate(cursorX, cursorY);
        ctx.rotate(rAnim);
        ctx.fillRect(-25, -25, 50, 50);
        ctx.strokeStyle = col[1];
        ctx.lineWidth = 1;
        ctx.strokeRect(-25, -25, 50, 50);
        if (tiles[hand].stacked != -1) {
            ctx.strokeRect(-18, -18, 36, 36);
            ctx.lineWidth = 2;
            ctx.strokeRect(-12, -12, 24, 24);
        }
        ctx.resetTransform();
        tiles[hand].rPos = calcRPos(hand, tiles[hand].stacked);
        displayPos(ctx, tiles[hand].rPos, cursorX, cursorY, 50, rAnim);
        if (Math.abs(rAnim) < 0.1) {
            rAnim = 0;
        }
        rAnim *= 0.6;

        ctx.fillStyle = col[0]; //The "inventory" display
        ctx.fillRect(520, 280, 80, 80);
        if (tiles[hand].stacked != -1) {
            ctx.beginPath();
            ctx.moveTo(495, 310);
            ctx.lineTo(505, 320);
            ctx.lineTo(495, 330);
            ctx.fill();
            ctx.fillRect(400, 280, 80, 80);
            displayPos(ctx, tiles[tiles[hand].stacked].pos, 440, 320, 80, 0);
        }
        displayPos(ctx, tiles[hand].pos, 560, 320, 80, 0);

        if (selX != -1 && board[selX][selY] != -1) {
            if (checkStackCompat(board[selX][selY], hand)) { //TR
                if (checkCompat(selX, selY, hand) && tiles[hand].stacked == -1 && tiles[board[selX][selY]].stacked == -1) {
                    displayKey(ctx, "S", 585, 240);
                }
                displayArrow(ctx, 560, 240, 59, 0);
            }
            if (checkStackCompat(hand, board[selX][selY])) {
                displayArrow(ctx, 560, 240, 59, Math.PI);
            }
            if (tiles[hand].stacked != -1) { //BL
                if (checkStackCompat(board[selX][selY], tiles[hand].stacked)) {
                    displayArrow(ctx, 500, 240, 59, Math.PI / 8);
                }
                if (checkStackCompat(tiles[hand].stacked, board[selX][selY])) {
                    displayArrow(ctx, 500, 240, 59, Math.PI / 8 * 9);
                }
            }
            if (tiles[board[selX][selY]].stacked != -1) { //TL
                if (checkStackCompat(tiles[board[selX][selY]].stacked, hand)) {
                    displayArrow(ctx, 500, 240, 59, Math.PI / 8 * 15);
                }
                if (checkStackCompat(hand, tiles[board[selX][selY]].stacked)) {
                    displayArrow(ctx, 500, 240, 59, Math.PI / 8 * 7);
                }
                if (tiles[hand].stacked != -1) { //BL and TL
                    if (checkStackCompat(tiles[board[selX][selY]].stacked, tiles[hand].stacked)) {
                        displayArrow(ctx, 440, 240, 59, 0);
                    }
                    if (checkStackCompat(tiles[hand].stacked, tiles[board[selX][selY]].stacked)) {
                        displayArrow(ctx, 440, 240, 59, Math.PI);
                    }
                }
            }
        }
    }

    window.requestAnimationFrame(draw);
}

init();