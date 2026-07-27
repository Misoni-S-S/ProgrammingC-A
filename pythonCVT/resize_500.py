"""
小さいドット絵画像を、ドットの境界をぼかさずに 500x500 へ拡大するプログラム。
 
使い方:
    python resize_500.py 入力ファイル.png [出力ファイル.png]
    python resize_500.py 入力ファイル.png                      # 出力名を省略すると "元の名前_500.png" になる
    python resize_500.py 入力フォルダ 出力フォルダ              # フォルダ単位で一括変換
 
ポイント:
    ドット絵(1マス=数pxの画像)を通常の補間(bilinearなど)で拡大すると
    境界がぼやけてしまうため、Image.NEAREST(最近傍補間)で拡大している。
    これにより、各マスがくっきりした正方形のまま拡大される。
"""
 
import sys
from pathlib import Path
from PIL import Image
 
TARGET_SIZE = (500, 500)
 
 
def resize_image(src_path: Path, dst_path: Path):
    img = Image.open(src_path)
    # RGBA(透過あり)ならそのまま、RGBならそのまま維持して拡大する
    resized = img.resize(TARGET_SIZE, Image.NEAREST)
    resized.save(dst_path)
    print(f"{src_path.name} ({img.size[0]}x{img.size[1]}) -> {dst_path} (500x500)")
 
 
def main():
    if len(sys.argv) < 2:
        print("使い方: python resize_500.py 入力ファイル.png [出力ファイル.png]")
        print("        python resize_500.py 入力フォルダ 出力フォルダ")
        sys.exit(1)
 
    src = Path(sys.argv[1])
 
    if src.is_dir():
        # フォルダ一括変換
        dst_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else src.parent / f"{src.name}_500"
        dst_dir.mkdir(parents=True, exist_ok=True)
 
        image_exts = {".png", ".jpg", ".jpeg", ".bmp", ".gif"}
        files = [p for p in src.iterdir() if p.suffix.lower() in image_exts]
 
        if not files:
            print(f"画像ファイルが見つかりませんでした: {src}")
            return
 
        for path in files:
            resize_image(path, dst_dir / path.name)
 
    else:
        # 単一ファイル変換
        if len(sys.argv) > 2:
            dst = Path(sys.argv[2])
        else:
            dst = src.parent / f"{src.stem}_500{src.suffix}"
 
        resize_image(src, dst)
 
 
if __name__ == "__main__":
    main()
 