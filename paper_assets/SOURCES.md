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

- Student rollouts and sample retention, equations 6 and 13.
- Matched-size crops, overlap constraint, shared teacher parameters
  and student prefix, equations 7 and 8.
- Student-positive full-vocabulary JSD above the retained batch mean,
  equation 12. This is not positive-negative teacher divergence.
- Margin-based CDL, equation 9; combined objective and EMA, equation 14 and
  Algorithm 1.
- Figure 3 is shown as the original paper figure, without an autoplay
  reconstruction. The three input images below it come from that same figure.
- The benchmark table reproduces the complete Qwen3.5-based block of Table 1.
  The three ablation tables reproduce Avg6 from Tables 2, 3, and 4.
- Figures 6 and 7 include incorrect forced-choice predictions, explicitly
  stated in the website captions.

## Interactive Explanations and Extended Analysis

- The Vision-OPD/CV-OPD comparison summarizes sections 2.1-3.4. Both columns
  reuse Figure 3 input thumbnails for a matched schematic, not a new experiment.
- CDL sliders demonstrate a per-position hinge loss with full-vocabulary JSD
  (equation 9). Their scalar values are illustrative, independently adjustable,
  and do not represent measured or necessarily jointly realizable distributions.
- DAG uses full-vocabulary student-positive discrepancy and a strict
  greater-than comparison to the retained batch mean (equation 12, Algorithm 1).
  The seven word units and their scores are invented for explanation, not model
  tokenization or measured activations. The threshold slider simulates batch
  means; it is not a learned threshold or a change to the training procedure.
- The eight-rollout outcomes are illustrative. The sample gate follows
  equation 13: a retained sample includes incorrect as well as correct rollouts.
- The objective disclosure distinguishes equation 14's token/rollout weighting
  from Algorithm 1's separate OPD-weight and selected-CDL-count normalization.
  Top-100+tail applies to primary distillation; CDL and DAG use full vocabulary.
- Reported settings come from Appendix A.2 and Algorithm 1: margin and CDL
  weight 0.1, maximum negative-crop IoU 0.1, eight rollouts, EMA rate 0.05.
- Extended tables reproduce Table 3 and Table 4 Avg6. Gap columns are explicitly
  labeled arithmetic differences, not extra experiments. No standalone
  sample-filter or token-gate effect size or significance claim is supplied.
- Case questions, options and final choices follow Figures 4-7, pp. 15-16.
  Full model responses remain in the unmodified source figures. Figures 6-7
  lack a matching Vision-OPD/original-input response comparison, so no
  evidence-condition response toggle is fabricated.

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
Edge, save screenshots in `.tmp/website-checks`, and cover desktop, laptop,
tablet, and mobile layouts; relative asset paths; benchmark data; citation
copy and download; tabs; keyboard controls; dialogs; reduced-motion
preference; and loading under a GitHub Pages-style project subpath.
Additional checks cover CDL margin equality and boundaries, strict DAG
thresholds, both sample-filter states, extended disclosures, and case metadata.
