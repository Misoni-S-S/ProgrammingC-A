
let size = 0; //size*sizeの格子
let id = 0; //問題番号
let correctBoard = null;
let board = [];
let boardsize = 0;
let hedge = Math.ceil(size/2);

//本体の作成と設定
const stage = document.getElementById("stage");



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
        alert("正解！")
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
                const hintIndex = vList.length - hintSize + i;
                if (hintIndex >= 0 && hintIndex < vList.length) {
                    td.innerHTML = vList[hintIndex];
                }
            }else if(i >= hintSize && j < hintSize) {

                td.style.backgroundColor = "#e0e0e0"; 
                // 盤面上の行番号は (i - hintSize)
                // ※ここに横ヒントを配置する処理を書く
                const boardRow = i - hintSize; 
                const hList = hints(boardRow, 0);
                const hintIndex = hList.length - hintSize + j;
                if (hintIndex >= 0 && hintIndex < hList.length) {
                    td.innerHTML = hList[hintIndex];
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

// function hints(number, axis = 0){
//     //correctBoard使うよ
//     let tmp1=-1;
//     let tmp2=-1;
//     let count = 0;
//     let hintsList = [];
//     if ( axis === 0 ){
//         //yokoHintを書く
//         for (let i=0;i<size;++i){   
//             tmp2 = correctBoard[number][i]; //number行　i列の答えを出してヒントを決定する.
//             if(tmp2 === tmp1){
//                 count += 1;
//             }else{
//                 if (tmp2===0){
//                     if(count === 0){
//                         continue;
//                     }
//                     hintsList.push(count);
//                     count = 0;
//                 }else{
//                     //hintsList.push(" "); //空白を入れる
//                     count = 1;
//                 }
//                 tmp1 = tmp2
//             }
//         } 
//         if (count !== 0){
//             hintsList.push(count);
//         }

//     }else if( axis === 1 ){
//         //tateHintを書く
//         for (let i=0; i<size; ++i){
//             tmp2 = correctBoard[i][number];
//             if(tmp2 === tmp1){
//                 count+=1;
//             }else{
//                 if(tmp2===0){
//                     if(count === 0){
//                         continue;
//                     }
//                     hintsList.push(count);
//                     count = 0;
//                 }else{
//                     hintsList.push(" ");
//                     count = 1;
//                 }
//                 tmp1 = tmp2;
//             }
//         }
//         if (count !== 0){
//             hintsList.push(count);
//         }
//     }
//     return hintsList;
// }

function hints(number, axis = 0) {
    let hintsList = [];
    let count = 0;

    for (let i = 0; i < size; i++) {
        // axis=0なら横(number行 i列)、axis=1なら縦(i行 number列)
        let cellData = (axis === 0) ? correctBoard[number][i] : correctBoard[i][number];

        if (cellData === 1) {
            // 黒マスの場合はカウントを1増やす
            count++;
        } else {
            // 白マス(0)が来て、かつカウントが1以上溜まっていればリストに追加
            if (count > 0) {
                hintsList.push(count);
                count = 0; // カウントをリセット
            }
        }
    }
// 行や列の最後まで黒マスだった場合、最後のカウントを追加
    if (count > 0) {
        hintsList.push(count);
    }

    // 1つも黒マスがなかった場合は、ヒントを [0] にする
    if (hintsList.length === 0) {
        hintsList.push(0);
    }

    return hintsList;
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