# Website Figure Sources

All research images and numerical results are from the user-supplied
`CV_OPD_Contrastive_Vision_OPD_ICLR_27.pdf`. No stock or generated images
are used to stand in for paper evidence.

| Website asset | Manuscript source | Use |
| --- | --- | --- |
| `figure-1-hires.png` | Figure 1, page 1 | Shortcut observation and overview |
| `figure-2-hires.png` | Figure 2, page 4 | Corruption diagnostics and attention |
| `figure-3-hires.png` | Figure 3, page 5 | Expandable original pipeline |
| `method-full.png` | Figure 3, image object 37 | Full-image student input |
| `method-positive.png` | Figure 3, image object 39 | Answer-relevant teacher crop |
| `method-negative.png` | Figure 3, image object 41 | Unrelated teacher crop |
| `cvopd-figure-4-complete.png` | Figure 4, page 15 | Existing lock attention artwork |
| `cvopd-figure-5-complete.png` | Figure 5, page 15 | Existing black-mask comparison |
| `cvopd-figure-6-complete.png` | Figure 6, page 16 | Existing umbrella example |
| `cvopd-figure-7-complete.png` | Figure 7, page 16 | Existing glove example |

`scripts/extract_website_assets.py` reproduces the six newly extracted images.
The page crops are rendered at 4x PDF scale; this does not add detail to
low-resolution bitmap images embedded in the original manuscript.

## Method Correspondence

- Stage 1: student rollouts and sample retention, equations 6 and 13.
- Stage 2: matched-size crops, overlap constraint, shared teacher parameters
  and student prefix, equations 7 and 8.
- Stage 3: student-positive full-vocabulary JSD above the retained batch mean,
  equation 12. This is not positive-negative teacher divergence.
- Stage 4: margin-based CDL, equation 9. Distribution movement is schematic;
  no measured probabilities or distances are implied.
- Stage 5: combined objective and EMA, equation 14 and Algorithm 1.
- Token words reproduce the illustrative outputs of Figure 3. They are not
  presented as independently generated teacher trajectories.
- The benchmark table selects rows from Table 1; the ablation uses Table 2.
- Figures 6 and 7 include incorrect forced-choice predictions, explicitly
  stated in the website captions.

## Icons

`lucide.min.js` is a locally vendored Lucide browser bundle.
See `lucide-LICENSE.txt` for the ISC and inherited Feather MIT notices.
The page needs no external JavaScript, fonts, or image requests.

## Local Verification

Open `index.html` directly in a browser. No development server is required.

For extraction, install PyMuPDF in the active Python environment or
`.tmp/pdf-tools`, then run `python scripts/extract_website_assets.py`.
Image object IDs apply to the supplied PDF version and should be rechecked
when the manuscript changes.

For automated browser checks, install `@playwright/test` in `.tmp/site-tools`
and run `node scripts/test_website.cjs`. The checks use installed Microsoft
Edge, save screenshots in `.tmp/website-checks`, and cover five viewport
widths, image loading, diagram overflow, tabs, keyboard controls, dialogs,
autoplay, pause, and reduced-motion preference.
