
# CV-OPD: Contrastive Vision On-Policy Distillation

Official implementation of **Contrastive Vision On-Policy Distillation (CV-OPD)**.

## Overview

CV-OPD is a contrastive on-policy self-distillation framework designed to improve fine-grained visual understanding and mitigate shortcut learning in vision-language models.

Building upon Vision-OPD, CV-OPD introduces positive and negative crop-conditioned teachers to encourage the student to distinguish answer-relevant visual evidence from irrelevant visual cues.

The framework consists of two key components:

- **Contrastive Divergence Loss (CDL):** Encourages the student to align with the positive teacher while maintaining a margin from the negative teacher.
- **Discrepancy Aware Gate (DAG):** Selects informative tokens for contrastive supervision and filters unreliable training samples.

## Environment Setup

```bash
conda create -n cv-opd python=3.12 -y
conda activate cv-opd

pip install -r requirements.txt
pip install -e . --no-deps
```

## Training

CV-OPD is implemented using Qwen3.5-4B and trained with on-policy self-distillation.

The training pipeline includes:

1. Preparing visual reasoning data and positive/negative image crops.
2. Generating on-policy student rollouts.
3. Applying standard distillation and gated contrastive supervision.
4. Updating the teacher using exponential moving average (EMA).

Training and data preparation scripts are provided in `scripts/`.

## Evaluation

We evaluate CV-OPD on six fine-grained visual understanding benchmarks:

- V* Bench
- ZoomBench
- HR-Bench 4K / 8K
- MME-RealWorld EN / CN

Evaluation scripts are available in `eval/`.

## Acknowledgements

This implementation builds upon the Vision-OPD framework and verl.
