import cv2
import numpy as np
from glob import glob
import json
from pathlib import Path


def auto_downscale(board):
    """2x2ブロックが全て同一値なら、半分のサイズに縮小する"""
    h, w = board.shape
    if h % 2 == 0 and w % 2 == 0:
        reshaped = board.reshape(h // 2, 2, w // 2, 2)
        if np.all(reshaped == reshaped[:, :1, :, :1]):
            return reshaped[:, 0, :, 0]
    return board

def custom_dumps(obj, indent=5, level=0):
    """board の行(数値だけのリスト)は1行にまとめ、それ以外は通常通りインデントする"""
    pad = " " * (indent * level)
    pad_child = " " * (indent * (level + 1))

    if isinstance(obj, dict):
        if not obj:
            return "{}"
        items = [
            f'{pad_child}"{k}": {custom_dumps(v, indent, level + 1)}'
            for k, v in obj.items()
        ]
        return "{\n" + ",\n".join(items) + "\n" + pad + "}"

    elif isinstance(obj, list):
        if not obj:
            return "[]"
        # 中身が数値だけのリスト(=board の1行)なら1行にまとめる
        if all(isinstance(x, (int, float)) for x in obj):
            return "[" + ", ".join(json.dumps(x) for x in obj) + "]"
        else:
            items = [
                pad_child + custom_dumps(x, indent, level + 1) for x in obj
            ]
            return "[\n" + ",\n".join(items) + "\n" + pad + "]"

    else:
        return json.dumps(obj, ensure_ascii=False)
    
def find_target(answer_dict, size):
    for entry in answer_dict:
        if entry.get("size") == size:
            return entry["issue"]
    return None

def board_exists(issue_list, board):
    """issue_list の中に同じ board を持つ要素が既にあるかどうかを判定する"""
    for item in issue_list:
        if isinstance(item, dict) and item.get("board") == board:
            return True
    return False
        

ANSWER_PATH = Path(__file__).parent / "answer.json"
answer_DIR = Path(__file__).parent / "answer"

file_path = glob(str(answer_DIR / "*"))
print(f"answer フォルダ: {answer_DIR}")
print(f"見つかったファイル数: {len(file_path)}")
print(file_path)

if ANSWER_PATH.exists() and ANSWER_PATH.stat().st_size > 0:
    with open(ANSWER_PATH, encoding="utf-8") as f:
        answer_dict = json.load(f)
else:
    answer_dict = [
        {"size": 3, "issue": []},
        {"size": 5, "issue": []},
        {"size": 10, "issue": []},
    ]


def next_id(issue_list):
    ids = [item["id"] for item in issue_list if isinstance(item, dict) and "id" in item]
    return max(ids) + 1 if ids else 1


def find_target(answer_dict, size):
    for entry in answer_dict:
        if entry.get("size") == size:
            return entry["issue"]
    return None


for path in file_path:
    title = Path(path).stem
    print(f"--- {title} ---")

    img = cv2.imread(path)
    if img is None:
        print(f"  ✗ 画像を読み込めませんでした: {path}")
        continue

    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    board = np.where(gray_img >= 200, 1, 0)
    board = auto_downscale(board)  # ここで2px/セルなら自動的に半分に

    img_shape_h, img_shape_w = board.shape[:2]
    print(f"  画像サイズ: {img_shape_h} x {img_shape_w}")

    if img_shape_h != img_shape_w:
        print("  ✗ 正方形ではないためスキップ")
        continue

    size = img_shape_h

    issue_list = find_target(answer_dict, size)
    if issue_list is None:
        print(f"  ✗ size={size} に対応する枠が answer.json にありません")
        continue

    board_list = board.tolist()

    if board_exists(issue_list, board_list):
        print(f"  ✗ 同じ答え(board)が既に登録済みのためスキップ: {title}")
        continue

    answer = {
        "id": next_id(issue_list),
        "title": title,
        "board": board_list,
    }
    issue_list.append(answer)
    with open(ANSWER_PATH, "w", encoding="utf-8") as f:
        f.write(custom_dumps(answer_dict, indent=5))
    print(f"  ✓ 追加しました (id={answer['id']}, size={size})")