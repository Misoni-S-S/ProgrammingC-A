//import answer from "./answer.json" ;

let size = 0; //size*sizeの格子
let id = 0; //問題番号
let correctBoard = null;
let board = [];


//本体の作成と設定
const stage = document.getElementById("stage");

// stage.setAttribute("border","1");
// stage.setAttribute("cellspacing","0");
// stage.setAttribute('width', (size * 40).toString());
// stage.setAttribute('height', (size * 40).toString());

//2次元配列の作成
function creadBoard(size) {
    let newBoard = Array.from({ length: size }, () => Array(size).fill(0));
    return newBoard
}

async function startGame() {
    const sizeInput = document.getElementById("sizeInput").value;
    const idInput = document.getElementById("idInput").value;
    size = parseInt(sizeInput,10);
    id = parseInt(idInput,10);

    boardsize = size + Math.ceil(size/2); //hint + issue

    board = creadBoard(boardsize);
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
    stage.setAttribute('width', (size * 40).toString());
    stage.setAttribute('height', (size * 40).toString());

    for (let i = 0; i<size; i++){
        const tr = document.createElement("tr");

        for (let j = 0; j<size; j++){

            const cellData = board[i][j];
            const td = document.createElement("td");

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
            td.setAttribute('width', '40');
            td.setAttribute('height', '40');
    
            tr.appendChild(td);
        }
        stage.appendChild(tr);
    }
    check()
}
function hints(number, axis = 0){
    //correctBoard使うよ
    let tmp1=-1;
    let tmp2=-1;
    let count = 0;
    let hintsList = [];
    if ( axis === 0 ){
        //yokoHintを書く
        for (let i=0;i<size;++i){   
            tmp2 = correctBoard[number][i]; //number行　i列の答えを出してヒントを決定する.
            if(tmp2 === tmp1){
                count += 1;
            }else{
                if (tmp2===0){
                    hintsList.push(count);
                    count = 0;
                }else{
                    hintsList.push(" "); //空白を入れる
                    count = 1;
                }
                tmp1 = tmp2
            }
        } 
        if (count !== 0){
            hintsList.push(count);
        }

    }else if( axis === 1 ){
        //tateHintを書く
        for (let i=0; i<size; ++i){
            tmp2 = correctBoard[i][number];
            if(tmp2 === tmp1){
                count+=1;
            }else{
                if(tmp2===0){
                    hintsList.push(count);
                    count = 0;
                }else{
                    hintsList.push(" ");
                    count = 1;
                }
                tmp1 = tmp2;
            }
        }
        if (count !== 0){
            hintsList.push(count);
        }
    }
    return hintsList;
}


//デバッグ用
function outanswer(){
    const stage = document.getElementById("stage");
    //.innerHTML = ''; //重要!!!! 再表示する際に前のやつも表示しないようにする
    stage.setAttribute("border","1");
    stage.setAttribute("cellspacing","0");
    stage.setAttribute('width', (size * 40).toString());
    stage.setAttribute('height', (size * 40).toString());

    for (let i = 0; i<size; i++){
        const tr = document.createElement("tr");
        for (let j = 0; j<size; j++){

            const cellData1 = tergetAnswer.board[i][j];
            const td = document.createElement("td");

            if(cellData1 === 1) {
                td.setAttribute("bgColor","black");
            }else if (cellData1 === 2) {
                td.setAttribute("bgColor","white");
                td.setAttribute('align', 'center');
                td.setAttribute('valign', 'middle');
                td.innerHTML = "x";
            }else {
                td.setAttribute("bgColor","white");
            }
            td.setAttribute('width', '40');
            td.setAttribute('height', '40');
    
            tr.appendChild(td);
        }
    stage.appendChild(tr);
    }
}



//マスの設定
for (let r = 0; r < size; r++){
    const tr = document.createElement("tr");//行

    for (let c = 0; c < size; c++){
        const td = document.createElement("td");//マス

        td.setAttribute("weight","40");//マスサイズ
        td.setAttribute("height","40");
        

        tr.appendChild(td);//行にマス追加
    }
    stage.appendChild(tr);//本体に行追加
}



//左クリック(〇)された時のイベント
stage.addEventListener("click",function(event){
    const clickedElement = event.target;//本当の要素を特定

    if (clickedElement.tagName !== "TD") {//マス(td)じゃないとき無視
        return;
    }
    const row = clickedElement.parentNode.rowIndex;//行番号
    const col = clickedElement.cellIndex;//列番号

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
    const row = clickedElement.parentNode.rowIndex;//行番号
    const col = clickedElement.cellIndex;//列番号

    //tableのrow, colを2にする処理
    if (board[row][col] === 0 || board[row][col] === 1){
        board[row][col] = 2;
    }else{
        board[row][col] = 0
    }
    console.log(`右クリックされた座標: 行=${row}, 列=${col}`);//確認用
    render();
})