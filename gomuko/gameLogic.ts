import {IMove, deepClone, deepEquals} from '../common/common';

export type Board = string[][]; // 'B' is black, 'W' is white, '' is empty
export interface BoardDelta {
  row: number;
  col: number;
}
export type RiddleData = 'r1' | 'r2' | 'r3' | 'r4' | 'r5';
export enum Difficulty {
  NOVICE = 3,
  MEDIUM = 4,
  EXPERT = 5,
}

export interface IState {
  board: Board;
  boardBeforeMove: Board;
  delta: BoardDelta | null; // [-1,-1] means a pass.
  difficulty: Difficulty;
  riddleData?: RiddleData;
  riddleWin?: number[];
  riddleWon?: boolean;
}

function isPosOnHintLine(row: number, col: number, hint: RiddleData) {
  switch (hint) {
    case 'r1':
      return row == 0;
    case 'r2':
      return row == 1;
    case 'r3':
      return row == 2;
    case 'r4':
      return row == 3;
    case 'r5':
      return row == 4;
  }
}

export function checkRiddleData(state: IState, turnIndex: number, firstMoveSolutions: IMove<IState>[]): boolean {
  const {riddleData} = state;
  return !riddleData
    ? false
    : firstMoveSolutions.some(
        (firstMove) =>
          firstMove.state.delta && isPosOnHintLine(firstMove.state.delta.row, firstMove.state.delta.col, riddleData)
      );
}

// returns a new [empty] weiqi board
// code adapted from: http://stackoverflow.com/questions/6495187/best-way-to-generate-empty-2d-array
export function createNewBoardWithElement<T>(dim: number, element: T): T[][] {
  let rows = dim;
  let cols = dim;
  const array: T[][] = [];
  const row: T[] = [];
  while (cols--) row.push(element);
  while (rows--) array.push(row.slice());
  return array;
}
export function createNewBoard(dim: number): Board {
  return createNewBoardWithElement(dim, '');
}

// returns copy of JS object
function copyObject<T>(object: T): T {
  return deepClone(object);
}

function isBoardFull(board: Board) {
  const dim = board.length;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      if (!board[i][j]) return false;
    }
  }
  return true;
}

// returns a random move that the computer plays
export function createComputerMove(board: Board, turnIndexBeforeMove: number) {
  const possibleMoves: IMove<IState>[] = [];
  const dim = board.length;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const delta = {row: i, col: j};
      try {
        const testmove = createMove(board,  delta, turnIndexBeforeMove);
        possibleMoves.push(testmove);
      } catch (e) {
        // cell in that position was full
      }
    }
  }
  try {
    const delta = {row: -1, col: -1};
    const testmove = createMove(board, delta, turnIndexBeforeMove);
    possibleMoves.push(testmove);
  } catch (e) {
    // Couldn't add pass as a move?
  }
  const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  return randomMove;
}

/** Returns the number of pieces of the color for turnIndex. */
function getboardNum(board: Board, turnIndex: number): number {
  let sum = 0;
  const dim = board.length;
  const color = turnIndex ? 'W' : 'B';
  for (let i = 0; i < dim; i++) for (let j = 0; j < dim; j++) if (board[i][j] === color) sum++;
  return sum;
}

export function createMove(
  board: Board,
  delta: BoardDelta,
  turnIndexBeforeMove: number,
  riddleWin?: number[],
  riddleData?: RiddleData
): IMove<IState> {


  const setnumBefore = getboardNum(board, turnIndexBeforeMove);

  const boardAfterMove = copyObject(board);

  const row = delta.row;
  const col = delta.col;
 if (boardAfterMove[row][col] !== '') {
    // if space isn't '' then bad move
    throw Error('Space is not empty!');
  } else {
    // //////////////////////////
    // //////////////////////////
    // //////////////////////////
    // //////////////////////////
    // //////////////////////////
    // //////////////////////////

    boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'B' : 'W';
    // if(checkWinCondition(boardAfterMove, row, col, turnIndexBeforeMove === 0 ? 'B' : 'W')){
    //   let endMatchScores: number[] | null = null;
    //   endMatchScores=[1,0]
    // }

  }
  let endMatchScores: number[] | null = null;
  let turnIndexAfterMove = 1 - turnIndexBeforeMove;
  //const boardAfterMove = deepClone(board);
  boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'B' : 'W';
  const winner = checkWinCondition(boardAfterMove, row, col, turnIndexBeforeMove === 0 ? 'B' : 'W');
  let turnIndex: number;
  if (winner !== '' || isGameOver(boardAfterMove)) {
    // Game over.
    turnIndexAfterMove = -1;
    if(turnIndexAfterMove === -1) endMatchScores = winner === 'B' ? [1, 0] : winner === 'W' ? [0, 1] : [0, 0];
  } else {
    // Game continues. Now it's the opponent's turn (the turn switches from 0 to 1 and 1 to 0).
    turnIndex = 1 - turnIndexBeforeMove;
    endMatchScores = null;
  }

  const setnumAfter = getboardNum(boardAfterMove, turnIndexBeforeMove);

  if (setnumAfter <= setnumBefore) throw Error('you can not suicide.');

  // let endMatchScores: number[] | null = null;

  // if (isBoardFull(boardAfterMove)) {
  //   endMatchScores = [-1, -1];
  //   turnIndexAfterMove = -1;
  // }

  let riddleWon = false;
  if (riddleData) {
    if (riddleWin)
      if (riddleWin[0] == delta.row && riddleWin[1] == delta.col) {
        riddleWon = true;
        turnIndexAfterMove = -1;
        endMatchScores = [1, 0];
      }
  }

  return {
    endMatchScores: endMatchScores,
    turnIndex: turnIndexAfterMove,
    state: {
      board: boardAfterMove,
      boardBeforeMove: board,
      delta: delta,
      riddleWon: riddleWon,
      difficulty: Difficulty.NOVICE,
    },
  };
}

export function createEndMove(state: IState, endMatchScores: number[]): IMove<IState> {
  return {
    endMatchScores: endMatchScores,
    turnIndex: -1,
    state: state,
  };
}

export function getInitialState(): IState {
  return {
    board: createNewBoard(9),
    boardBeforeMove: createNewBoard(9),
    delta: {row: 0, col: 0},
    difficulty: Difficulty.NOVICE,
  };
}

// #region  Win Check
function checkWinCondition(board: string[][], row: number, col: number, playerColor: string): string {
  if (
    checkRow(board, row, col, playerColor) ||
    checkColumn(board, row, col, playerColor) ||
    checkDiagonal(board, row, col, playerColor)
  ) {
    return playerColor;
  }
  // gameFinished("no one");
  return '';
  // if (checkDraw()) gameFinished("no one");
}

function checkRow(board: string[][], row: number, col: number, playerColor: string): boolean {
  const winnerCells = [];
  for (let i = col + 1; i < 9; i++) {
    if (board[row][i] === playerColor) {
      winnerCells.push({row: row, column: i});
    } else break;
  }
  if (winnerCells.length == 4) {
    return true;
  }

  for (let i = col - 1; i >= 0; i--) {
    if (board[row][i] === playerColor) {
      winnerCells.push({row: row, column: i});
    } else break;
  }
  if (winnerCells.length == 4) {
    return true;
  }

  return false;
}

function checkColumn(board: string[][], row: number, col: number, playerColor: string): boolean {
  const winnerCells = [];
  for (let i = row + 1; i < 9; i++) {
    if (board[i][col] === playerColor) {
      winnerCells.push({row: i, column: col});
    } else break;
  }
  if (winnerCells.length == 4) return true;

  for (let i = row - 1; i >= 0; i--) {
    if (board[i][col] === playerColor) {
      winnerCells.push({row: i, column: col});
    } else break;
  }
  if (winnerCells.length == 4) return true;

  return false;
}

function checkDiagonal(board: string[][], row: number, col: number, playerColor: string): boolean {
  // DIAG \
  let winnerCells = [];
  for (let i = 1; i < 9; i++) {
    if (row + i >= 9 || col + i >= 9) {
      break;
    }
    if (board[row + i][col + i] === playerColor) {
      winnerCells.push({row: row + i, column: col + i});
    } else break;
  }
  if (winnerCells.length == 4) return true;

  for (let i = 1; i < 9; i++) {
    if (row - i < 0 || col - i < 0) {
      break;
    }

    if (board[row - i][col - i] === playerColor) {
      winnerCells.push({row: row - i, column: col - i});
    } else break;
  }
  if (winnerCells.length == 4) return true;

  //  OTHER DIAG /
  winnerCells = [];
  for (let i = 1; i < 9; i++) {
    if (row - i < 0 || col + i > 9) {
      break;
    }

    if (board[row - i][col + i] === playerColor) {
      winnerCells.push({row: row - i, column: col + i});
    } else break;
  }

  if (winnerCells.length == 4) {
    return true;
  }

  for (let i = 1; i < 9; i++) {
    if (row + i >= 9 || col - i < 0) {
      break;
    }

    if (board[row + i][col - i] === playerColor) {
      winnerCells.push({row: row + i, column: col - i});
    } else break;
  }

  if (winnerCells.length == 4) {
    return true;
  }

  return false;
}


function isGameOver(board: Board): boolean {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board.length; j++) {
      if (board[i][j] === '') {
        // If there is an empty cell then we do not have a tie.
        return false;
      }
    }
  }
  // No empty cells, so we have a tie!
  return true;
}