import cv2
import numpy as np
from glob import glob
import json
from pathlib import Path

file_path = glob("ansor/*")

with open("answer.json", encoding="utf-8") as f:
    answer_dict = json.load(f)

# img_shape(= h//2) -> answer_dict のインデックス
SHAPE_TO_INDEX = {3: 0, 5: 1, 10: 2}


def next_id(issue_list):
    """issue リストの最後の要素の id + 1 を返す。空 or 取得失敗なら 1。"""
    try:
        return issue_list[-1]["id"] + 1
    except (IndexError, KeyError):
        return 1
    

for path in file_path:
    answer = {"title": Path(path).stem}
    print(answer["title"])

    img = cv2.imread(path)
    if img is None:
        print(f"画像を読み込めませんでした: {path}")
        continue

    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    board = np.where(gray_img == 255, 1, 0)

    img_shape_h, img_shape_w = board.shape[:2]
    if img_shape_h != img_shape_w:
        # 正方形じゃない画像はスキップ
        continue

    img_shape = img_shape_h // 2
    if img_shape not in SHAPE_TO_INDEX:
        # 想定外サイズもスキップ
        continue

    answer["board"] = board.tolist()

    target_index = SHAPE_TO_INDEX[img_shape]
    issue_list = answer_dict[target_index]["issue"]
    answer["id"] = next_id(issue_list)
    issue_list.append(answer)

# print(answer_dict)

with open("answer.json", "w", encoding="utf-8") as f:
    json.dump(answer_dict, f, indent=5)