// object sudoku
var sudoku = new Object();

sudoku.problem = new Array();
sudoku.getProblem = function (diff) {
    var xmlhttp = new XMLHttpRequest();
    var tmp = this;
    xmlhttp.onreadystatechange = function() {
        var s = xmlhttp.responseText;
        if (xmlhttp.readyState == 4 && xmlhttp.status==200) {
            for (var i = 0; i < 9; ++i) {
                tmp.problem[i] = new Array();
                for (var j = 0; j < 9; ++j) {
                    tmp.problem[i][j] = s[i*9+j];
                }
            }
        } else {
        }
    }

    xmlhttp.open("GET", "/new_sudoku?"+diff, false);
    xmlhttp.send();
};

sudoku.answer = undefined;
sudoku.multi = false;
sudoku.getAnswer = function () {
    var xmlhttp = new XMLHttpRequest();
    var tmp = this;
    tmp.answer = undefined;
    xmlhttp.onreadystatechange = function () {
        var s = xmlhttp.responseText;
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            if (s[0] == 'N') return;
            tmp.multi = (s[0] == 'M');
            tmp.answer = new Array();
            for(var i = 0; i < 9; ++i) {
                tmp.answer[i] = new Array();
                for (var j = 0; j < 9; ++j) {
                    tmp.answer[i][j] = s[i*9+j+1];
                }
            }
        } else {
        }
    }

    var str = "";
    for (var i = 0; i < 9; ++i) {
        for (var j = 0; j < 9; ++j) {
            str += Math.abs(sudoku.problem[i][j]);
        }
    }

    xmlhttp.open("GET", "/get_answer?"+str, false);
    xmlhttp.send();

    return true;
};

function init_note() {
    ret = new Array();
    for (var i = 0; i < 9; ++i) {
        ret[i] = new Array();
        for (var j = 0; j < 9; ++j) {
            ret[i][j] = new Array();
            for (var k = 0; k < 10; ++k) {
                ret[i][j][k] = false;
            }
        }
    }
    return ret;
};

sudoku.setCell = function (i, j, n) {
    if (this.problem[i][j] > 0) return;

    if (!this.note[i][j][0]) {
        if (this.problem[i][j] <= 0)
            this.problem[i][j] = -n;
    } else {
        this.problem[i][j] = 0;
        if (n != 0) {
            this.note[i][j][n] = !this.note[i][j][n];
        } else {
            for (var k = 1; k < 10; ++k) {
                this.note[i][j][k] = false;
            }
        }
    }
};

sudoku.clear = function () {
    for (var i = 0; i < 9; ++i) {
        for (var j = 0; j < 9; ++j) {
            this.problem[i][j] = 0;
        }
    }
}
// object sudoku end


// redraw canvases
function updateCanvas()
{
    var COLOR_PROBLEM = "#000000";
    var COLOR_ANSWER = "#871F78";
    var COLOR_FILLED = "#0000FF";
    var COLOR_NOTE = "#000000";
    var COLOR_WRONG = "#FF0000";

    var pen = canvasSudoku.getContext("2d");

    pen.clearRect(0, 0, 539, 539);
    canvasSudoku.width = canvasSudoku.width; // trick to avoid bad drawing

    for (var i = 0; i < 3; ++i) {
        for (var j = 0; j < 3; ++j) {
            pen.fillStyle = (i+j)%2?"#EFF0DC":"#DCF7A1";
            pen.fillRect(180*i, 180*j, 180, 180);
        }
    }

    // draw lines between grids
    pen.lineWidth=6;
    pen.strokeStyle = "#000000";
    for (var i = 0; i < 4; ++i) {
        pen.moveTo(0, 180*i);
        pen.lineTo(539, 180*i);
        pen.moveTo(180*i, 0);
        pen.lineTo(180*i, 539);
    }
    pen.stroke();

    // draw lines between cells
    pen.lineWidth = 2;
    for (var i = 0; i < 9; ++i) {
        pen.moveTo(0, 60*i);
        pen.lineTo(539, 60*i);
        pen.moveTo(60*i, 0);
        pen.lineTo(60*i, 539);
    }
    pen.stroke();

    // draw number in cells
    pen.font = "60px calibri";
    for (var i = 0; i < 9; ++i) {
        for (var j = 0; j < 9; ++j) {
            var px = 60*j + 13, py = 60*i + 50;
            if (sudoku.problem[i][j] > 0) { // given by puzzle
                pen.fillStyle = COLOR_PROBLEM;
                pen.fillText(sudoku.problem[i][j], px, py);
            } else if (sudoku.problem[i][j] <= 0) { // filled by user
                if ((gameStatus == "playing" || gameStatus == "editting") && sudoku.problem[i][j] <= 0) {
                    if (!sudoku.note[i][j][0]) {
                        if (sudoku.problem[i][j] != 0) {
                            pen.fillStyle = check(i, j)?COLOR_FILLED:COLOR_WRONG;
                            pen.fillText(-sudoku.problem[i][j], px, py);
                        }
                    } else {
                        pen.font = "20px calibri";
                        pen.fillStyle = COLOR_NOTE;
                        for (var p = 0; p < 3; ++p) {
                            for (var q = 0; q < 3; ++q) {
                                var num = 3*p+q+1;
                                if (sudoku.note[i][j][num]) {
                                    pen.fillText(num, px+20*q-8, py-20*p+7);
                                }
                            }
                        }
                        pen.font = "60px calibri";
                    }
                } else if (gameStatus == "answering") {
                    if (sudoku.problem[i][j] < 0) {
                        pen.fillStyle = COLOR_FILLED;
                        pen.fillText(-sudoku.problem[i][j], px, py);
                    } else {
                        pen.fillStyle = COLOR_ANSWER;
                        pen.fillText(sudoku.answer[i][j], px, py);
                    }
                }
            }
        }
    }

    var COLOR_INDICATOR = "orange";
    pen.lineWidth = 6;
    pen.strokeStyle = COLOR_INDICATOR;
    pen.strokeRect(60*canvasSudoku.curCell[1], 0, 60, 539);
    pen.strokeRect(0, 60*canvasSudoku.curCell[0], 539, 60);
    pen.strokeStyle = COLOR_INDICATOR;
    pen.strokeRect(60*canvasSudoku.curCell[1], 60*canvasSudoku.curCell[0], 60, 60);

    pen = canvasKeys.getContext("2d");
    pen.clearRect(0, 0, 600, 60);
    canvasKeys.width = canvasKeys.width;
    pen.font = "60px Calibri";
    pen.lineWidth = 3;
    pen.fillStyle = COLOR_FILLED;
    for (var i = 0; i < 9; ++i) {
        pen.strokeStyle = "#000000";
        var px = 60*i + 13;
        pen.fillText(i+1, px, 50);
        pen.strokeRect(60*i, 0, 60, 60);
        if (sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0] && sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][i+1]) {
            pen.strokeRect(60*i+5, 5, 50, 50);
        }
    }

    pen.strokeStyle = "#000000";
    pen.strokeRect(540, 0, 60, 60);
    pen.strokeRect(600, 0, 60, 60);
    pen.fillText('N', 610, 50);
    if (sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0]) {
        pen.strokeRect(605, 5, 50, 50);
    }

    function check(m, n)
    {
        // check in row and col
        for (var i = 0; i < 9; ++i) {
            if (i != n && Math.abs(sudoku.problem[m][i]) == Math.abs(sudoku.problem[m][n]))
                return false;
            if (i != m && Math.abs(sudoku.problem[i][n]) == Math.abs(sudoku.problem[m][n]))
                return false;
        }

        // check in grid
        var i0 = Math.floor(m/3)*3, j0 = Math.floor(n/3)*3;
        for (var i = 0; i < 3; ++i) {
            for (var j = 0; j < 3; ++j) {
                if (i0+i != m && j0+j != n && Math.abs(sudoku.problem[i0+i][j0+j]) == Math.abs(sudoku.problem[m][n]))
                    return false;
            }
        }

        return true;
    }
}
// canvas redrawer end


// will be set by window.onload
var canvasSudoku;
var canvasKeys;

var gameStatus = "playing";
// this will run as soon as the page is loaded
window.onload = (function () {
    // set canvasSudoku event processor
    canvasSudoku = document.getElementById("canvas_sudoku");
    canvasSudoku.curCell = [4, 4];

    canvasSudoku.onmousedown = function (e) {
        var box = canvasSudoku.getBoundingClientRect();
        this.curCell = [Math.floor((e.clientY-box.top*(canvasSudoku.height/box.height))/60),
        Math.floor((e.clientX-box.left*(canvasSudoku.width/box.width))/60)];
        updateCanvas();
    }

    // set canvasKeys event processor
    canvasKeys = document.getElementById("canvas_keys");
    canvasKeys.onmousedown = function (e) {
        if (gameStatus == "answering") return;
        var box = canvasKeys.getBoundingClientRect();
        this.curCell = Math.floor((e.clientX-box.left*(canvasKeys.width/box.width))/60);
        if (this.curCell == 10 && sudoku.problem[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]] <= 0) {
            sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0] =
                !sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0];
        } else {
            sudoku.setCell(canvasSudoku.curCell[0], canvasSudoku.curCell[1], this.curCell<9?this.curCell+1:0);
        }
        updateCanvas();
    }

    // set keypress processor
    document.onkeypress = function (e) {
        // number
        if (gameStatus != "answering" && e.which >= 48 && e.which <= 57) {
            sudoku.setCell(canvasSudoku.curCell[0], canvasSudoku.curCell[1], e.which - 48);
        } else if (String.fromCharCode(e.which) == "w") {
            --canvasSudoku.curCell[0];
        } else if (String.fromCharCode(e.which) == "s") {
            ++canvasSudoku.curCell[0];
        } else if (String.fromCharCode(e.which) == "a") {
            --canvasSudoku.curCell[1];
        } else if (String.fromCharCode(e.which) == "d") {
            ++canvasSudoku.curCell[1];
        } else if (String.fromCharCode(e.which) == ".") {
            sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0] =
                !sudoku.note[canvasSudoku.curCell[0]][canvasSudoku.curCell[1]][0];
        }

        if (canvasSudoku.curCell[0] == -1) canvasSudoku.curCell[0] = 8;
        if (canvasSudoku.curCell[0] == 9) canvasSudoku.curCell[0] = 0;
        if (canvasSudoku.curCell[1] == -1) canvasSudoku.curCell[1] = 8;
        if (canvasSudoku.curCell[1] == 9) canvasSudoku.curCell[1] = 0;

        updateCanvas();
    }

    newGame();

    updateCanvas();
});

function newGame()
{
    sudoku.note = init_note();
    document.getElementById("multi_solution").hidden = true;
    gameStatus = "playing";
    var diff = document.getElementById("input_difficulty").value;
    sudoku.getProblem(diff);

    document.getElementById("btn_show_ans").innerHTML = "Answer";
    document.getElementById("btn_show_ans").onclick = showAnswer;

    updateCanvas();
}

function edit()
{
    document.getElementById("multi_solution").hidden = true;
    gameStatus = "editting";
    sudoku.clear();

    document.getElementById("btn_show_ans").innerHTML = "Answer";
    document.getElementById("btn_show_ans").onclick = showAnswer;

    updateCanvas();
}

var prevStatus;
function showAnswer()
{
    if (gameStatus == "answering") {
        return;
    }

    sudoku.getAnswer();
    if (sudoku.answer == undefined) {
        alert("No solution");
        return;
    }

    document.getElementById("multi_solution").hidden = !sudoku.multi;

    prevStatus = gameStatus;
    gameStatus = "answering";
    document.getElementById("btn_show_ans").innerHTML = "Retry";
    document.getElementById("btn_show_ans").onclick = retry;

    updateCanvas();
}

function retry()
{
        document.getElementById("multi_solution").hidden = true;
        gameStatus = prevStatus;
        document.getElementById("btn_show_ans").innerHTML = "Answer";
        document.getElementById("btn_show_ans").onclick = showAnswer;
        updateCanvas();
}

function changeDiff()
{
    document.getElementById("num_diff").innerHTML = document.getElementById("input_difficulty").value;
}

function showHowTo()
{
    alert("Use w, a, s, d or mouse to select cell\n\n \
Use keyboard or number keys to fill and erase\n\n \
Use '.' to enable notes");
}