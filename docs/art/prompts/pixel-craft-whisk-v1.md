# craft-whisk-v1 — 採用原本の生成記録

- 採用日: 2026-10-20、オーナーのチャット承認。
- 生成: built-in image_gen。
- 候補: `art-inbox` commit `d99b2d954cd04cd758c031332cea8ca572dc59a1` の `inbox/20261020/craft-whisk-c1.png`。
- 正式原本: `art/pixel/craft/craft-whisk-v1.png`。
- 参照: mify-ref-v2.png + mify-idle-c1.png。
- 保存: 無加工コピー。縮小・減色・切り抜きなし。
- サイズ: 1774×887。
- SHA256: `afb3d701fa466dd7d08c4067aa30752520a42b18d36a9c6fa745e8b5ed1e6374`。
- Git blob: `b1d1a55fb36099db9f049a92590b88f1d77ddf1f`。
- 仕様検査: 原本へcheckerは実行しない。変換後にClaudeが検査する。

## プロンプト

Use case: stylized-concept. Asset for CAKING medieval cozy bakery game. Redraw as genuine deliberately designed LOW RESOLUTION pixel art, not a pixelated or downsampled watercolor. Large readable eyes and clean broad color clusters. Exact uniform square pixel lattice, no antialiasing, no gradients, no texture, no shadows outside sprite. One logical pixel dark brown outer contour. Pure white background. Use at most 16 flat colors chosen ONLY from this shared palette: #3B292C, #65433B, #936044, #C18C61, #E4B783, #FFF1D6, #E8D4B7, #B9A68E, #FFDDBB, #EFB494, #CA806F, #A64F65, #D97987, #F3A5AA, #FFD0CA, #FFFFFF, #623744, #993F4D, #CE5B5A, #EF8970, #46513C, #6C7850, #A5AF70, #D0CC92, #353746, #555468, #83869A, #BDC8CA, #537C85, #83ADB0, #C4DAD6, #DBB357. No captions, no labels, no frame borders. Nearly frontal, very slightly turned toward viewer right. Create ONE very wide horizontal animation spritesheet of EXACTLY FOUR equal frames in a single row, left to right, no margins between frame cells, no dividers. Logical frame 128x96, sheet 512x96, integer upscale 4x => 2048x384 preferred. It is essential the canvas is 16:3, not square and not two rows. All four frames show the SAME two-head-tall chibi Mify from reference 2, identity from reference 1: brown bob/cat ears and tail, head ribbon on viewer right, pink maid dress, cream apron, brown boots. Scene: Mify at left part of each frame manually whisking in a blue-grey ceramic bowl on wooden medieval workbench. Use 128x96 logical pixel grid per frame with chunky uniform pixels and no tiny details. Bench top same logical y62 each frame, feet bottom y90, camera and table and head/body anchor fixed. Bowl at x53,y55. Keep right half of worktop at x77..115 EMPTY for cake overlay; do NOT draw any cake, tart, pastry, fruit or decoration. Bowl alone may contain cream. Four clear successive whisk hand positions around a small oval: left/down, center/up, right/down, center/low. Small discrete cream flecks may vary just above bowl. No electric mixers, no stove, no modern devices. Pure white background, no floor shadow, no labels. Sprite silhouette and pixel size match across all frames, dark brown 1-dot outline. Maximum 16 flat colors from given palette. Loop from frame4 back to1.
