// Narration and interface text. {x} placeholders are filled with live measurements.
export const TEXT = {
  ja: {
    title: '水晶は、まだ ふるえている',
    sub: 'The Quartz Is Still Trembling',
    lead: 'あなたの 端末の 中で ふるえている 水晶と、甲斐の 国の 水晶の はなし。',
    note: '音が 出ます（ヘッドホンを おすすめします）。約3分。この作品は あなたの 端末の 時間を はかりますが、その 情報は どこにも 送りません。',
    start: 'はじめる',
    startOther: 'Start in English',
    about: 'この作品について',
    save: 'この水晶を 画像で のこす',
    again: 'もういちど',
    close: 'とじる',
    saving: '画像を つくっています…',
    hudPeriod: 'フレーム間隔',
    hudRate: '画面',
    hudLayers: '層',
    perSec: '回／秒',
    lines: [
      // chapter 1
      { at: 2.0, d: 6.0, t: 'あなたが いま 見ている 画面の 奥に、小さな 水晶が ある。' },
      { at: 8.5, d: 6.0, t: '水晶は、電気を かけると、決まった 速さで ふるえる。' },
      { at: 15.0, d: 6.5, t: '時計の 水晶は、1秒間に 32,768回。' },
      // chapter 2: the divider chain starts right after this line
      { at: 22.0, d: 2.6, t: 'それを、2で わる。' },
      // chapter 3
      { at: 60.5, d: 6.5, t: '15回 わると、1。 これが、わたしたちの 1秒。' },
      { at: 67.5, d: 5.5, t: 'いま、この 画面が 書きかわる 間隔を はかっている。' },
      { at: 73.5, d: 7.0, t: '1回 およそ {period}ミリ秒。 けれど、毎回 少しずつ ゆれている。' },
      { at: 81.0, d: 6.6, t: 'その ゆれを、1秒に 1枚ずつ、水晶の 中に 重ねていく。 大きく ゆれた 秒ほど、層は 濃い。' },
      { at: 88.0, d: 7.0, t: '育った あとが、幻のように 中に 残った 水晶を、ファントム水晶と いう。' },
      // chapter 4: Kai province
      { at: 96.0, d: 7.5, t: '甲斐の 国、御岳 昇仙峡の 奥。 金峰山で 水晶が 見つかったと 伝えられている。' },
      { at: 104.0, d: 7.0, t: '天保5年（1834年）ごろ、京都の 職人が、水晶を 磨く 技を 甲府に 伝えた。' },
      { at: 111.5, d: 5.5, t: '山梨は かつて、日本一の 水晶の 産地だった。' },
      { at: 117.5, d: 7.5, t: '山の 水晶は やがて 掘りつくされ、大正の はじめからは、ブラジルの 水晶が 甲府で 磨かれた。' },
      { at: 125.5, d: 7.5, t: '磨く 技は、通信や 光学に 使う 結晶づくりや、シリコンウェハーを 磨く 技へと 受けつがれた。' },
      { at: 133.5, d: 7.0, t: 'いま、世界中の 時計や 電話の 中で ふるえているのは、工場の 釜で 育てられた 水晶だ。' },
      // chapter 5: two clocks
      { at: 141.5, d: 7.0, t: 'あなたの 端末には、時を 数える 時計と、画面を 書きかえる 時計が ある。' },
      { at: 149.0, d: 7.5, t: '画面は 1秒に {hz}回 書きかわる。 {nominal}回 ちょうどでは ない。', alt: '画面は 1秒に {hz}回 書きかわる。 ほとんど {nominal}回 ちょうど。' },
      { at: 157.0, d: 7.5, t: 'ちょうどとの ずれ（{ppm}）を {amp}倍に して、ふたつの ドの 音の うなりで 聞いている。', beat: true },
      // chapter 6: your crystal
      { at: 165.5, d: 6.5, t: 'あなたの 水晶は、{mm}分{ss}秒で {n}枚の 層を もった。' },
      { at: 172.5, d: 6.0, t: 'その ゆれかたは、ほかの だれの 端末とも ちがう。' },
      { at: 179.0, d: 0, t: '水晶は、まだ ふるえている。', last: true },
    ],
    rateFallback: 'ふたつの 時計の 速さは、ぴったりとは 合わない。',
    beatFallback: 'その ちがいを、ふたつの ドの 音の うなりに たとえて 聞いている。',
    dividerNote: { 32768: '人には 聞こえない', 256: 'ド', 16: 'ここから 音は 拍に なる' },
    stats: (s) => `${s.mm}分${s.ss}秒・層 ${s.n}枚（濃い 層 ${s.ph}枚）・いちばん 大きな ゆれ ${s.max}ミリ秒・画面 ${s.hz}回／秒`,
    imageCaption: 'わたしの 端末で 育った 水晶',
    aboutHtml: `
<h2>水晶は、まだ ふるえている</h2>
<p>時計や スマートフォンや パソコンの 中には、小さな 水晶の かけらが 入っています。水晶は 電気を かけると 決まった 速さで ふるえる 性質が あり、腕時計の 水晶は 1秒間に 32,768回 ふるえます。32,768は 2を 15回 かけた 数なので、2で 15回 わると 1に なります。わたしたちの「1秒」は、こうして 水晶の ふるえから 数えられています。</p>
<p>山梨は かつて、日本一の 水晶の 産地でした。御岳 昇仙峡の 奥、金峰山で 水晶が 見つかったことが 始まりと 伝えられ、天保5年（1834年）ごろには 京都の 職人が 水晶を 磨く 技を 甲府に 伝えました。山梨の 水晶が 掘りつくされると、大正の はじめからは ブラジルの 水晶が 輸入されて 甲府で 磨かれ、甲府は 宝飾の 町に なりました。水晶を 磨く 技は、通信用・光学用の 結晶づくりや、シリコンウェハーの 研磨にも 受けつがれています。</p>
<p>この作品は、あなたの 端末が 画面を 書きかえる 間隔を ブラウザの 中で はかり、その ゆれを 1秒に 1枚ずつ、画面の 中の 水晶に 層として 重ねていきます。同じ 端末の ほかの 秒と くらべて ゆれが 大きかった 秒ほど 層は 濃く なり、フレームが とびこされた 秒の 層は 緑に、最初の 1秒の 層は 琥珀色に なります。成長の あとが 幻のように 内側に 残った 水晶は「ファントム水晶」と よばれます。ここで 育つのは、あなたの 端末の 時間の ファントム水晶です。</p>
<h3>はかっているもの</h3>
<ul>
<li>画面が 書きかわる 時刻（requestAnimationFrame）。1回ごとの 間隔の ゆれ、とびこし、1秒あたりの 回数を 計算します。</li>
<li>1秒ごとの 合図は、音を 鳴らす しくみ（Web Audio）の 時計で きざんでいます。</li>
<li>ブラウザから 見える ゆれには、水晶だけでなく、OS や ブラウザの 処理の 都合も まじっています。この作品は、その すべてを ふくめて「あなたの 端末の 時間」として 描いています。</li>
<li>音の うなりは、画面の 回数と ちょうどの 回数との ずれを 拡大した ものです（拡大の 倍率は 画面に 表示します）。</li>
</ul>
<h3>個人情報について</h3>
<p>計算は すべて あなたの ブラウザの 中で 行い、どこにも 送信しません。画像の 保存も、あなたの 端末の 中だけで 行います。</p>
<h3>参考にした 資料</h3>
<ul>
<li>山梨県「山梨が誇る『ものづくり技術』」（水晶研磨の 技術と その 応用）</li>
<li>山梨県「ジュエリー産地やまなしヒストリー」（江戸時代の 研磨技術の 伝来、大正初期からの ブラジル産水晶の 輸入）</li>
<li>山梨県「水晶貴石細工」（昇仙峡・金峰山の 水晶）</li>
</ul>
<h3>制作</h3>
<p>プログラム・映像・音は すべて この作品の ために つくりました。映像は WebGL で、音は Web Audio で その場で 生成しています。</p>
<p>フォント：しっぽり明朝（SIL Open Font License 1.1）</p>`,
  },
  en: {
    title: 'The Quartz Is Still Trembling',
    sub: '水晶は、まだ ふるえている',
    lead: 'About the quartz trembling inside your device, and the quartz of the old province of Kai.',
    note: 'This work has sound (headphones recommended). About 3 minutes. It times your device, but sends nothing anywhere.',
    start: 'Start',
    startOther: '日本語で はじめる',
    about: 'About this work',
    save: 'Save this crystal as an image',
    again: 'Watch again',
    close: 'Close',
    saving: 'Making the image…',
    hudPeriod: 'frame interval',
    hudRate: 'screen',
    hudLayers: 'layers',
    perSec: '/s',
    lines: [
      { at: 2.0, d: 6.0, t: 'Somewhere behind the screen you are looking at, there is a small crystal of quartz.' },
      { at: 8.5, d: 6.0, t: 'Give quartz a little electricity, and it trembles at a fixed speed.' },
      { at: 15.0, d: 6.5, t: 'A clock crystal trembles 32,768 times a second.' },
      { at: 22.0, d: 2.6, t: 'Divide that by two.' },
      { at: 60.5, d: 6.5, t: 'Divide fifteen times, and you reach 1. That is our second.' },
      { at: 67.5, d: 5.5, t: 'Right now, this page is timing how often your screen redraws.' },
      { at: 73.5, d: 7.0, t: 'About {period} milliseconds each time. But every frame wavers a little.' },
      { at: 81.0, d: 6.6, t: 'Once a second, that wavering is laid down as a layer inside the crystal. The more it wavered, the denser the layer.' },
      { at: 88.0, d: 7.0, t: 'A crystal that keeps ghostly traces of its own growth is called a phantom quartz.' },
      { at: 96.0, d: 7.5, t: 'In the old province of Kai, quartz is said to have been found on Mount Kinpu, beyond the Mitake Shosenkyo gorge.' },
      { at: 104.0, d: 7.0, t: 'Around 1834, a craftsman from Kyoto brought the art of polishing quartz to Kofu.' },
      { at: 111.5, d: 5.5, t: 'Yamanashi was once the leading source of quartz in Japan.' },
      { at: 117.5, d: 7.5, t: 'The mountain crystal was mined out. From the early Taisho era, Brazilian quartz was polished in Kofu.' },
      { at: 125.5, d: 7.5, t: 'The polishing skills lived on, in growing crystals for communications and optics, and in polishing silicon wafers.' },
      { at: 133.5, d: 7.0, t: 'The quartz trembling inside the world’s clocks and phones today is grown in factory vessels.' },
      { at: 141.5, d: 7.0, t: 'Your device has a clock that counts time, and another that redraws the screen.' },
      { at: 149.0, d: 7.5, t: 'Your screen redraws {hz} times a second. Not exactly {nominal}.', alt: 'Your screen redraws {hz} times a second. Almost exactly {nominal}.' },
      { at: 157.0, d: 7.5, t: 'You are hearing that difference ({ppm}), magnified {amp} times, as a beat between two Cs.', beat: true },
      { at: 165.5, d: 6.5, t: 'Your crystal grew {n} layers in {mm} min {ss} s.' },
      { at: 172.5, d: 6.0, t: 'No other device trembles quite like yours.' },
      { at: 179.0, d: 0, t: 'The quartz is still trembling.', last: true },
    ],
    rateFallback: 'The two clocks never run at quite the same speed.',
    beatFallback: 'You are hearing that difference, imagined as a beat between two Cs.',
    dividerNote: { 32768: 'beyond human hearing', 256: 'C', 16: 'from here, sound becomes rhythm' },
    stats: (s) => `${s.mm} min ${s.ss} s · ${s.n} layers (${s.ph} dense) · largest wobble ${s.max} ms · screen ${s.hz}/s`,
    imageCaption: 'A crystal grown in my device',
    aboutHtml: `
<h2>The Quartz Is Still Trembling</h2>
<p>Inside clocks, phones and computers there are tiny pieces of quartz. Quartz trembles at a fixed speed when electricity is applied; a watch crystal trembles 32,768 times a second. 32,768 is two multiplied by itself fifteen times, so dividing by two fifteen times gives 1. That is how our "second" is counted from the trembling of a stone.</p>
<p>Yamanashi was once the leading source of quartz in Japan. The story is said to begin with quartz found on Mount Kinpu, beyond the Mitake Shosenkyo gorge, and around 1834 a craftsman from Kyoto brought the art of polishing quartz to Kofu. When the local quartz was mined out, Brazilian quartz was imported from the early Taisho era and polished in Kofu, which became a town of jewellery. The polishing skills lived on in growing crystals for communications and optics, and in polishing silicon wafers.</p>
<p>This work times, inside your browser, how your device redraws the screen, and lays that wavering down, one layer per second, inside the crystal on the screen. Compared with the other seconds on the same device, the seconds that wavered more leave denser layers; a second with skipped frames leaves a green layer, and the very first second an amber one. A quartz that keeps ghostly traces of its growth inside is called a phantom quartz. What grows here is a phantom quartz of your device's time.</p>
<h3>What is measured</h3>
<ul>
<li>The time of each screen redraw (requestAnimationFrame): the wavering of each interval, skipped frames, and redraws per second.</li>
<li>The one-second pulse is counted by the clock of the sound system (Web Audio).</li>
<li>The wavering seen from a browser includes not only the quartz but also the work of the operating system and the browser. The piece draws all of it together as the time of your device.</li>
<li>The beat you hear is the difference between your screen's rate and the round number, magnified (the factor is shown on screen).</li>
</ul>
<h3>Privacy</h3>
<p>Everything is calculated in your browser and nothing is sent anywhere. Saving the image also happens only on your device.</p>
<h3>Sources</h3>
<ul>
<li>Yamanashi Prefecture, on the prefecture's manufacturing skills (quartz polishing and its uses)</li>
<li>Yamanashi Prefecture, history of the Yamanashi jewellery industry (polishing in the Edo period; Brazilian quartz from the early Taisho era)</li>
<li>Yamanashi Prefecture, on quartz and gemstone crafts (Shosenkyo and Mount Kinpu)</li>
</ul>
<h3>Making</h3>
<p>All code, images and sound were made for this work; the images are drawn with WebGL and the sound is generated with Web Audio as you watch.</p>
<p>Font: Shippori Mincho (SIL Open Font License 1.1)</p>`,
  },
};

// The divider chain: 32,768 Hz halved fifteen times.
export const DIVIDER = Array.from({ length: 16 }, (_, i) => 32768 / 2 ** i);
export const DIVIDER_START = 24.6; // seconds into the piece
export const DIVIDER_STEP = 2.2;   // seconds per step
// the 1 Hz step plays two pulses; the growth ticks continue that rhythm without a gap
export const GROWTH_START = DIVIDER_START + (DIVIDER.length - 1) * DIVIDER_STEP + 2.0;
export const END_AT = 181.0;
