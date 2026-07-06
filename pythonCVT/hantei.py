"""
ピクロス(ノノグラム)の判定プログラム

「問題として成り立たない」の定義:
    board(正解)から生成した行・列のヒント(clue)だけを使って解いたとき、
    解が唯一に定まらない(=別解が存在してしまう)問題は不成立とみなす。

使い方:
    python picross_validator.py answer.json

answer.json の想定フォーマット:
    [
      {"size": 3, "issue": [ {"id": 1, "title": "apple", "board": [[0,1,0],[1,1,1],[1,1,1]]}, ... ] },
      {"size": 5, "issue": [ ... ] },
      {"size": 10, "issue": [ ... ] }
    ]
"""

import json
import sys
from dataclasses import dataclass, field


# ---------- 基本ユーティリティ ----------

def generate_runs(line):
    """0/1配列からラン長(連続する1の長さ)のリストを作る。例: [0,1,1,0,1] -> [2,1]"""
    runs = []
    count = 0
    for v in line:
        if v == 1:
            count += 1
        else:
            if count > 0:
                runs.append(count)
            count = 0
    if count > 0:
        runs.append(count)
    return runs


def clues_from_board(board):
    """正解boardから行・列のヒント(clue)を計算する"""
    size = len(board)
    row_clues = [generate_runs(row) for row in board]
    col_clues = []
    for c in range(size):
        col = [board[r][c] for r in range(size)]
        col_clues.append(generate_runs(col))
    return row_clues, col_clues


# ---------- 1行分の候補パターン生成 ----------

def generate_line_combos(clue, length):
    """与えられたclueに対して、あり得る0/1パターン(長さlength)を全列挙する"""
    n = len(clue)

    if n == 0:
        return [[0] * length]

    total_blocks = sum(clue)
    min_length = total_blocks + (n - 1)
    if min_length > length:
        return []

    results = []

    def rec(index, pos, arr):
        if index == n:
            final_arr = arr[:]
            for i in range(pos, length):
                final_arr[i] = 0
            results.append(final_arr)
            return

        block_len = clue[index]
        remaining_min = sum(clue[index + 1:]) + (n - index - 1)
        max_start = length - remaining_min - block_len

        for start in range(pos, max_start + 1):
            new_arr = arr[:]
            for i in range(pos, start):
                new_arr[i] = 0
            for i in range(start, start + block_len):
                new_arr[i] = 1
            rec(index + 1, start + block_len + 1, new_arr)

    rec(0, 0, [0] * length)
    return results


# ---------- 列の途中経過チェック(枝刈り用) ----------

def partial_column_valid(col_values, clue):
    """
    col_values: 上から途中まで埋まった列の値(0/1のリスト)
    clue: その列の正式なヒント
    「ここまでの内容が、最終的にclueと矛盾しない可能性が残っているか」を判定する
    """
    runs = []
    i = 0
    n = len(col_values)
    while i < n:
        if col_values[i] == 1:
            j = i
            while j < n and col_values[j] == 1:
                j += 1
            runs.append({"len": j - i, "open": j == n})
            i = j
        else:
            i += 1

    completed = runs
    open_run = None
    if runs and runs[-1]["open"]:
        open_run = runs[-1]
        completed = runs[:-1]

    if len(completed) > len(clue):
        return False
    for k, run in enumerate(completed):
        if run["len"] != clue[k]:
            return False
    if open_run:
        idx = len(completed)
        if idx >= len(clue):
            return False
        if open_run["len"] > clue[idx]:
            return False
    return True


# ---------- 解の個数を数える(バックトラック) ----------

def count_solutions(row_clues, col_clues, size, limit=2):
    """
    row_clues, col_clues から解が何通りあるかを数える。
    limit に達したら早期終了する(全探索を避けて高速化するため)。
    """
    row_combos = [generate_line_combos(clue, size) for clue in row_clues]

    # どこかの行に候補が1つも無い(=そもそも矛盾したclue)場合は解0
    if any(len(combos) == 0 for combos in row_combos):
        return 0

    grid = [None] * size
    solution_count = 0

    def is_column_complete(col_index):
        col_values = [grid[r][col_index] for r in range(size)]
        return generate_runs(col_values) == col_clues[col_index]

    def backtrack(row_index):
        nonlocal solution_count
        if solution_count >= limit:
            return

        if row_index == size:
            for c in range(size):
                if not is_column_complete(c):
                    return
            solution_count += 1
            return

        for combo in row_combos[row_index]:
            grid[row_index] = combo

            valid = True
            for c in range(size):
                col_values = [grid[r][c] for r in range(row_index + 1)]
                if not partial_column_valid(col_values, col_clues[c]):
                    valid = False
                    break

            if valid:
                backtrack(row_index + 1)
                if solution_count >= limit:
                    return

    backtrack(0)
    return solution_count


# ---------- 1問を判定する ----------

@dataclass
class ValidationResult:
    valid: bool
    solution_count: object
    is_trivial: bool
    reason: str = None
    row_clues: list = field(default_factory=list)
    col_clues: list = field(default_factory=list)


def validate_puzzle(board):
    """
    board(正解データ)を渡すと、そのboardから作ったclueで解いたときに
    解が一意に定まるかどうかを判定して返す。
    """
    size = len(board)

    # 正方形チェック
    if any(len(row) != size for row in board):
        return ValidationResult(
            valid=False, solution_count=None, is_trivial=False,
            reason="正方形の盤面ではありません"
        )

    row_clues, col_clues = clues_from_board(board)
    solution_count = count_solutions(row_clues, col_clues, size, limit=2)

    # 全マス0(何もヒントが無い)問題は退屈だが解自体は一意なので別フラグで警告
    is_trivial = all(len(r) == 0 for r in row_clues) or all(len(c) == 0 for c in col_clues)

    reason = None
    if solution_count == 0:
        reason = "生成したヒントから正解自体が再現できません(内部エラーの可能性)"
    elif solution_count >= 2:
        reason = "ヒントだけでは解が一意に定まりません(別解が存在します)"
    elif is_trivial:
        reason = "ヒントが空(全マス0など)で問題として単純すぎます"

    return ValidationResult(
        valid=(solution_count == 1 and not is_trivial),
        solution_count=("2以上(別解あり)" if solution_count >= 2 else solution_count),
        is_trivial=is_trivial,
        reason=reason,
        row_clues=row_clues,
        col_clues=col_clues,
    )


# ---------- answer.json 全体をチェックするランナー ----------

def run_from_file(json_path):
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for size_entry in data:
        size = size_entry.get("size")
        for issue in size_entry.get("issue", []):
            if not issue or not issue.get("board"):
                continue

            result = validate_puzzle(issue["board"])
            results.append({
                "size": size,
                "id": issue.get("id"),
                "title": issue.get("title"),
                "result": result,
            })

    return results


def print_report(results):
    bad = [r for r in results if not r["result"].valid]
    ok = [r for r in results if r["result"].valid]

    print(f"チェックした問題数: {len(results)}")
    print(f"成立: {len(ok)} / 不成立: {len(bad)}")
    print()

    if bad:
        print("--- 問題があるもの ---")
        for r in bad:
            res = r["result"]
            print(
                f'[size={r["size"]}] id={r["id"]} title="{r["title"]}" '
                f'-> {res.reason} (解の数: {res.solution_count})'
            )
    else:
        print("すべての問題が一意な解を持っています。")


if __name__ == "__main__":
    json_path = sys.argv[1] if len(sys.argv) > 1 else "answer.json"
    results = run_from_file(json_path)
    print_report(results)