# 水晶は、まだ ふるえている — The Quartz Is Still Trembling

https://hidetohiranuma.github.io/suisho/

あなたの 端末の 中で ふるえている 水晶と、甲斐の 国の 水晶の はなし。約3分の ウェブ作品です（音が 出ます）。

時計や スマートフォンの 中では、小さな 水晶が 1秒間に 32,768回 ふるえて 時を きざんでいます。この作品は、あなたの 端末が 画面を 書きかえる 間隔の ゆれを ブラウザの 中で はかり、1秒に 1枚ずつ、画面の 中の 水晶に 層として 重ねていきます。成長の あとが 幻のように 残った「ファントム水晶」が、あなたの 端末の 時間で 育ちます。あわせて、金峰山の 水晶から はじまった 山梨の 水晶研磨の 歴史を たどります。

## 見かた

- ページを ひらいて「はじめる」（英語は Start in English）を おします。約3分で おわります。
- 動作環境：Windows 10/11 または macOS 15 以降の Edge・Chrome・Safari（WebGL2 が 必要）。スマートフォンでも 見られます。
- 最後に、育った 水晶を 画像（PNG）で 保存できます。

## しくみ

- 映像：WebGL2 の フラグメントシェーダで、水晶（六角柱と 菱面体の 先端）を 解析的に 描いています。屈折・分散・全反射を 計算し、成長の 層（ファントム）は 層の 密度を 記録した テクスチャから 光の 散乱として 描きます。
- 計測：requestAnimationFrame の 時刻から、フレーム間隔の 中央値・回帰による 画面の 回数・1秒ごとの ばらつき・とびこしを 求めます。ほかの 秒と くらべて ゆれが 大きかった 秒ほど 層は 濃く、フレームが とびこされた 秒は 緑、最初の 1秒は 琥珀色の 層に なります。
- 音：Web Audio で その場で 合成しています（32,768 Hz から 1 Hz までの 分周、1秒ごとの 合図、ふたつの 256 Hz の うなり）。録音した 音や 楽曲は 使っていません。

## 個人情報

計算は すべて ブラウザの 中で 行い、どこにも 送信しません。外部の 解析タグや Cookie も ありません。

## 制作

- フォント：しっぽり明朝（Shippori Mincho、SIL Open Font License 1.1。`fonts/OFL.txt`）。作品で 使う 文字だけを 切り出しています。
- 参考：山梨県「山梨が誇る『ものづくり技術』」「ジュエリー産地やまなしヒストリー」「水晶貴石細工」。

## ローカルで 動かす

```
python3 -m http.server 8000
```

で このフォルダを 配信し、http://localhost:8000/ を ひらきます。

---

**English.** A three-minute web piece with sound. Inside clocks and phones, a tiny quartz crystal trembles 32,768 times a second. This page times how your screen redraws, inside your browser, and lays the wavering down as one layer per second inside a rendered quartz crystal, growing a "phantom quartz" out of your device's time, while telling the story of quartz in Yamanashi (old Kai province). Everything runs locally; nothing is sent anywhere. Rendering: WebGL2 (analytic ray tracing of the crystal with refraction and dispersion). Sound: Web Audio, synthesized live. Font: Shippori Mincho (SIL OFL 1.1).
