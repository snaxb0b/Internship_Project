# Model Weights

Place the RT-DETR model files in this directory before running the backend.

Required files:

- rtdetr-l.pt
- rtdetr-x.pt

Example paths:

weights/rtdetr-l.pt
weights/rtdetr-x.pt

`rtdetr-l.pt` and `rtdetr-x.pt` are tracked with **Git LFS**, so they are
included with the repository when Git LFS is installed. If you cloned without
Git LFS, run `git lfs install && git lfs pull` to download the real files
(otherwise you will only get small LFS pointer files).

Any other model files are not committed — you can place them here manually, or
Ultralytics will download them automatically from the official release assets
(e.g. `https://github.com/ultralytics/assets/releases`) the first time a model
is used.
