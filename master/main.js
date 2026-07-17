
let size = 0; //size*sizeの格子
let id = 0; //問題番号
let correctBoard = null;
let board = [];
let boardsize = 0;
let hedge = Math.ceil(size/2);

//本体の作成と設定
const stage = document.getElementById("stage");
 let checker = -1;


//関数

//2次元配列の作成
function createBoard(size) {
    let newBoard = Array.from({ length: size }, () => Array(size).fill(0));
    return newBoard
}

//ゲーム始める
async function startGame() {
    const sizeInput = document.getElementById("sizeInput").value;
    const idInput = document.getElementById("idInput").value;
    size = parseInt(sizeInput,10);
    id = parseInt(idInput,10);

    boardsize = size + Math.ceil(size/2); //hint + issue

    board = createBoard(size);
   //yourboard = createBoard(size);


    correctBoard = null;

    await getAnswer(size,id);

    if (!correctBoard || correctBoard.length === 0) {
        alert(`サイズ${size}の問題データ(board)がまだ作られていません！`);
        stage.innerHTML = '';
        return ;
    }
    render();
}

async function getAnswer(size,id){//id=>数字, 問題を取りだす。問題はtargetAnswer.boardで読み込めるよ
    try{
        const response = await fetch('answer.json');
        const answerList = await response.json();
        const answerObject = answerList.find(t => t.size === size);
        const targetAnswer = answerObject.issue.find(t => t.id === id);

        if (targetAnswer) {
            console.log(`ID${id}の問題が見つかりました:`, targetAnswer);
            console.log(`答えは ${targetAnswer.title}です。`);
            correctBoard = targetAnswer.board;
            return targetAnswer;
        }else{
            console.log(`ID${id}の問題が見つかりませんでした。`);  
        }
    } catch (error) {
        console.error('エラー:',error);
    }
}

function check(){//判定用
    tmp = 0

    for(let i = 0; i < size; i++){
        for (let j = 0; j < size; j++){
            if(board[i][j] === correctBoard[i][j]){ //boardを別の変数に変える -> 大きなstageから解く部分だけを参照した変数
            }else{
                if (board[i][j]!==2){
                    tmp = 1;
                }else{
                    if(correctBoard[i][j]===1){
                        tmp = 1
                    }
                }
            }
        }
    }
    if (tmp === 0){
        console.log("正解！");

    }else{
        console.log("不正解");
    }
}

function render(){//再描画 ＆ check()も含む
    const stage = document.getElementById("stage");
    stage.innerHTML = ''; //重要!!!! 再表示する際に前のやつも表示しないようにする
    stage.setAttribute("border","1");
    stage.setAttribute("cellspacing","0");
    stage.setAttribute('width', (boardsize * 40).toString());
    stage.setAttribute('height', (boardsize * 40).toString());
    const hintSize = Math.ceil(size / 2);
    const totalSize = boardsize;


    for (let i = 0; i<boardsize; i++){
        const tr = document.createElement("tr");

        for (let j = 0; j<boardsize; j++){
            const td = document.createElement("td");
            td.setAttribute('width', '40');
            td.setAttribute('height', '40');
            //const cellData = board[i][j];
            

            if(i < hintSize && j < hintSize) {

                td.style.border = "none";
            }else if(i < hintSize && j >= hintSize) {

                td.style.backgroundColor = "#e0e0e0"; // 背景をグレーにするなど
                // 盤面上の列番号は (j - hintSize)
                // ※ここに縦ヒントを配置する処理を書く
                const boardCol = j - hintSize;
                const vList = hints(boardCol, 1);
                // ★ 動的アシストの判定を追加
                const rawHints = getRawHints(boardCol, 1);
                const currentLine = getCurrentLine(boardCol, 1);
                const isAssist = checkAssist(rawHints, currentLine, size);
                
                // アシスト対象なら文字色を薄いグレーにする
                if (isAssist) {
                    td.style.backgroundColor = "#ccffff";
                }
                const hintIndex = vList.length - hintSize + i;
                if (hintIndex >= 0 && hintIndex < vList.length) {
                    //td.innerHTML = vList[hintIndex];
                    let hintData = vList[hintIndex];
                    td.innerHTML = hintData.num;
                    // もし確定(done)が true なら灰色＆太字にする！
                    if (hintData.done === true) {
                        td.style.color = "#b0b0b0"
                        td.style.fontWeight = "bold"; 
                    }
                }
            }else if(i >= hintSize && j < hintSize) {

                td.style.backgroundColor = "#e0e0e0"; 
                // 盤面上の行番号は (i - hintSize)
                // ※ここに横ヒントを配置する処理を書く
                const boardRow = i - hintSize; 
                const hList = hints(boardRow, 0);
                const rawHints = getRawHints(boardRow, 0);
                const currentLine = getCurrentLine(boardRow, 0);
                const isAssist = checkAssist(rawHints, currentLine, size);
                
                // アシスト対象なら文字色を薄いグレーにする
                if (isAssist) {
                    td.style.backgroundColor = "#ccffff";
                }
                const hintIndex = hList.length - hintSize + j;
                if (hintIndex >= 0 && hintIndex < hList.length) {
                    //td.innerHTML = hList[hintIndex];
                    let hintData = hList[hintIndex];
                    td.innerHTML = hintData.num; // 数字を表示
                    
                    // もし確定(done)が true なら灰色＆太字にする！
                    if (hintData.done === true) {
                        td.style.color = "#b0b0b0"
                        td.style.fontWeight = "bold";
                    }
                }
            }else {
                const boardRow = i - hintSize;
                const boardCol = j - hintSize;
                const cellData = board[boardRow][boardCol];
                if(cellData === 1) {
                    td.setAttribute("bgColor","black");
                }else if (cellData === 2) {
                    td.setAttribute("bgColor","white");
                    td.setAttribute('align', 'center');
                    td.setAttribute('valign', 'middle');
                    td.innerHTML = "x";
                }else {
                    td.setAttribute("bgColor","white");
                }
            }
            tr.appendChild(td);
        }
        stage.appendChild(tr);
    }
    check()
}


function hints(number, axis = 0) {
    let hintsList = [];
    let count = 0;
    let blockIndices = []; // 黒マスが連続している「座標」を記憶するリスト

    for (let i = 0; i < size; i++) {
        let cellData = (axis === 0) ? correctBoard[number][i] : correctBoard[i][number];

        if (cellData === 1) {
            count++;
            blockIndices.push(i); // 何番目のマスが黒かを記憶
        } else {
            if (count > 0) {
                // ブロックが確定したかチェックする
                let isDone = checkBlock(blockIndices, number, axis);
                // 数字(num)と確定状態(done)をセットにして保存
                hintsList.push({ num: count, done: isDone });
                count = 0;
                blockIndices = [];
            }
        }
    }
    
    // 行や列の最後が黒マスで終わっていた場合の処理
    if (count > 0) {
        let isDone = checkBlock(blockIndices, number, axis);
        hintsList.push({ num: count, done: isDone });
    }

    if (hintsList.length === 0) {
        hintsList.push({ num: 0, done: false });
    }

    return hintsList;
}
function checkBlock(indices, number, axis) {
    // 1. 答えの黒マスがあるべき場所が、すべて塗られているか？
    for (let idx of indices) {
        let userCell = (axis === 0) ? board[number][idx] : board[idx][number];
        if (userCell !== 1) return false; // 1つでも塗られていなければ未確定
    }

    // 2. 塗られすぎを防止（前後のマスまで余分に黒く塗られていないかチェック）
    let beforeIdx = indices[0] - 1;
    let afterIdx = indices[indices.length - 1] + 1;

    if (beforeIdx >= 0) {
        let userCellBefore = (axis === 0) ? board[number][beforeIdx] : board[beforeIdx][number];
        if (userCellBefore === 1) return false;
    }
    if (afterIdx < size) {
        let userCellAfter = (axis === 0) ? board[number][afterIdx] : board[afterIdx][number];
        if (userCellAfter === 1) return false;
    }

    return true; // 条件をすべてクリアしたら確定！
}

// ------------------------------------------
// アシスト機能（動的ヒント計算）
// ------------------------------------------

// 正解の盤面から純粋なヒントの配列（例: [1, 2]）を作る関数
function getRawHints(number, axis) {
    let list = [];
    let count = 0;
    for (let i = 0; i < size; i++) {
        let cell = (axis === 0) ? correctBoard[number][i] : correctBoard[i][number];
        if (cell === 1) count++;
        else if (count > 0) { list.push(count); count = 0; }
    }
    if (count > 0) list.push(count);
    return list;
}

// 現在のプレイヤーの入力行（列）を取得する関数
function getCurrentLine(number, axis) {
    let line = [];
    for (let i = 0; i < size; i++) {
        line.push((axis === 0) ? board[number][i] : board[i][number]);
    }
    return line;
}

// 確定できるマスが残っているか判定するメインエンジン
function checkAssist(hintsList, currentLine, size) {
    if (hintsList.length === 0) hintsList = [0];
    let validLines = [];

    // 考えられるすべての配置パターンを洗い出す
    function findPlacements(hintIndex, currentPos, currentPlacement) {
        if (hintIndex === hintsList.length || hintsList[0] === 0) {
            let finalLine = [...currentPlacement];
            while (finalLine.length < size) finalLine.push(2);

            // プレイヤーの現在の入力(〇=1, ×=2)と矛盾していないかチェック
            let isValid = true;
            for (let i = 0; i < size; i++) {
                if (currentLine[i] === 1 && finalLine[i] !== 1) isValid = false;
                if (currentLine[i] === 2 && finalLine[i] !== 2) isValid = false;
            }
            if (isValid) validLines.push(finalLine);
            return;
        }

        let block = hintsList[hintIndex];
        let remaining = hintsList.slice(hintIndex + 1);
        let minSpace = remaining.reduce((a, b) => a + b + 1, 0);

        for (let start = currentPos; start <= size - minSpace - block; start++) {
            let next = [...currentPlacement];
            while (next.length < start) next.push(2);
            for (let i = 0; i < block; i++) next.push(1);
            if (hintIndex < hintsList.length - 1) next.push(2);
            findPlacements(hintIndex + 1, next.length, next);
        }
    }

    findPlacements(0, 0, []);

    // 矛盾していてパターンがない場合はアシストしない
    if (validLines.length === 0) return false;

    // まだ塗られていない「0(空白)」のマスのうち、すべてのパターンで同じ結果になるマスを探す
    for (let i = 0; i < size; i++) {
        if (currentLine[i] === 0) {
            let alwaysOne = true;  // 絶対に黒になる
            let alwaysTwo = true;  // 絶対に×になる
            for (let line of validLines) {
                if (line[i] !== 1) alwaysOne = false;
                if (line[i] !== 2) alwaysTwo = false;
            }
            // どちらかが確定しているマスがあれば「アシスト対象(true)」として返す
            if (alwaysOne || alwaysTwo) return true;
        }
    }
    return false; // すでに確定マスを全部塗っている場合はアシストしない
}
//左クリック(〇)された時のイベント
stage.addEventListener("click",function(event){
    const clickedElement = event.target;//本当の要素を特定

    if (clickedElement.tagName !== "TD") {//マス(td)じゃないとき無視
        return;
    }
    const hintSize = Math.ceil(size / 2);
    const row = clickedElement.parentNode.rowIndex - hintSize;
    const col = clickedElement.cellIndex - hintSize;
    
    if (row < 0 || col < 0) {
        return;
    }
    //tableのrow, colを1にする処理
    if (board[row][col] === 0 || board[row][col] === 2){
        board[row][col] = 1;
        
    }else{
        board[row][col] = 0
        
    }
    console.log(`左クリックされた座標: 行=${row}, 列=${col}`);//確認用
    render();
})
//右クリック(×)された時のイベント
stage.addEventListener("contextmenu",function(event){
    event.preventDefault();//元の右クリックメニューを出さないようにする
    const clickedElement = event.target;//本当の要素を特定
    if (clickedElement.tagName !== "TD") {//マス(td)じゃないとき無視
        return;
    }
    const hintSize = Math.ceil(size / 2);
    const row = clickedElement.parentNode.rowIndex - hintSize;
    const col = clickedElement.cellIndex - hintSize;
    
    if (row < 0 || col < 0) {
        return;
    }
    //tableのrow, colを2にする処理
    if (board[row][col] === 0 || board[row][col] === 1){
        board[row][col] = 2;
    }else{
        board[row][col] = 0
    }
    console.log(`右クリックされた座標: 行=${row}, 列=${col}`);//確認用
    render();
})
