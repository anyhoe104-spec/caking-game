# cake-tops-v1 — 採用原本

- 採用: 2026-10-21、オーナーのチャット承認。生成: built-in image_gen。
- 候補: art-inbox `f84bdaa6b10be2a435428093461c61f9b7bf6467` / `inbox/20261021/cake-tops-c2.png`。
- 原本: `art/pixel/cakes/cake-tops-v1.png`。無加工コピー（縮小・減色・切り抜きなし）。
- 参照: art/pixel/palette-v1.png → inbox/20261021/cake-tops-c1.png。
- サイズ: 1774×887。SHA256: `22bfcb6ba5c6732b27927e59f341869a49bc1b5dd9e6eea9e3dc73c99dc544dd`。Git blob: `054256db885c189754a764e7d1c5bfcca26bf621`。
- 原本checkerは対象外。変換・ゲーム組み込みはClaudeが担当。

## 初回プロンプト

Create ONE transparent horizontal sprite sheet of FOUR separate cake TOPPERS, exactly4 equal panels, logical16x12 each, total64x12, aspect16:3. LEFT TO RIGHT: (1) cluster of EXACTLY THREE red strawberries with small green caps; (2) small cluster of fresh green herb leaves; (3) small cluster of ivory/golden sugar PEARL spheres; (4) ONE small gold medieval crown of a harbor town, simple3 points. These are detachable TOPPERS ONLY. NO cake, plate, pedestal, table, background, shadows, letters, grid or separators. Each cluster centered in its own cell with bottom at logical y10 so it can sit on a cake's upper surface, no scattered elements below baseline. Slightly elevated front three-quarter view; matching scale, each fits14x10 logical cells maximum with1-cell margins. Very COARSE pixel art,16 large square cells across each cell; chunky stepped1-pixel dark brown outlines, broad flat colors, no tiny texture, no gradients, no antialiasing. Max16 colors from reference palette, focus #3B292C #65433B #936044 #C18C61 #E4B783 #FFF1D6 #E8D4B7 #B9A68E #CE5B5A #993F4D #46513C #6C7850 #A5AF70 #DBB357 #FFFFFF. Real transparent alpha outside the four clusters, NO checkerboard painted into image.

## 修正指示

Edit this transparent4-topper sheet. Preserve exact identities and order:3 strawberries, green leaves, pearl cluster, gold crown. Fix layout ONLY: FOUR equally wide panels across entire image, EVERY object must be strictly inside its own quarter with generous10 percent panel-width empty margin on BOTH sides. The strawberry cluster currently crosses quarter1 boundary: make ALL FOUR clusters about75 percent of current size and center each at x12.5%,37.5%,62.5%,87.5% of image. Align all bottom contact points to same baseline at75% of image height. No objects touch any quarter boundary. Keep transparent canvas, no lines/text/panels/cake. Keep very coarse chunky16x12 logical pixel topper style.
