"""
ピクロス(ノノグラム)の別解表示プログラム

picross_validator.py で「別解あり(不成立)」と判定された問題について、
実際にどんな別解が存在するのかを盤面で表示する。

使い方:
    python picross_show_alternates.py answer.json
    python picross_show_alternates.py answer.json --limit 5   # 1問あたり最大5個の別解まで探す
    python picross_show_alternates.py answer.json --id 3 --size 5  # 特定の問題だけ見る
"""

import argparse
import json

from hantei import validate_puzzle, format_board, format_diff


def show_puzzle_alternates(entry, board, size, limit):
    """1問について、別解が見つかればタイトル・元の盤面・別解・差分を表示する"""
    result = validate_puzzle(board, solution_search_limit=limit)

    title = entry.get("title")
    puzzle_id = entry.get("id")

    if not result.alternate_solutions:
        return False  # 別解なし(表示しない)

    print("=" * 40)
    print(f'size={size} id={puzzle_id} title="{title}"')
    print(f"見つかった別解の数: {len(result.alternate_solutions)}"
          f"{'(まだ他にもある可能性があります)' if len(result.alternate_solutions) + 1 >= limit else ''}")
    print()
    print("[元の盤面(答え)]")
    print(format_board(board))
    print()

    for i, alt in enumerate(result.alternate_solutions, start=1):
        print(f"[別解 {i}]")
        print(format_board(alt))
        print()
        print("[差分(元の盤面との比較)] △=元は空白だが別解で黒 / ▽=元は黒だが別解で空白")
        print(format_diff(board, alt))
        print()

    return True


def main():
    parser = argparse.ArgumentParser(description="別解が存在する問題を表示する")
    parser.add_argument("json_path", nargs="?", default="answer.json", help="answer.json のパス")
    parser.add_argument("--limit", type=int, default=2, help="1問あたり最大何個まで別解を探すか(デフォルト2)")
    parser.add_argument("--id", type=int, default=None, help="指定したidの問題だけ調べる")
    parser.add_argument("--size", type=int, default=None, help="指定したsizeの問題だけ調べる")
    args = parser.parse_args()

    with open(args.json_path, encoding="utf-8") as f:
        data = json.load(f)

    found_any = False
    checked = 0

    for size_entry in data:
        size = size_entry.get("size")
        if args.size is not None and size != args.size:
            continue

        for entry in size_entry.get("issue", []):
            if not entry or not entry.get("board"):
                continue
            if args.id is not None and entry.get("id") != args.id:
                continue

            checked += 1
            if show_puzzle_alternates(entry, entry["board"], size, args.limit + 1):
                found_any = True

    print("=" * 40)
    print(f"チェックした問題数: {checked}")
    if not found_any:
        print("別解が見つかった問題はありませんでした。")


if __name__ == "__main__":
    main()