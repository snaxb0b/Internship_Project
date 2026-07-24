# Internship AI Inspection Project

A web application for uploading images and running object detection
using React, FastAPI, and Ultralytics YOLO.

## Main Technologies

- Python
- FastAPI
- React
- Vite
- Ultralytics YOLO
- OpenCV

## Requirements

- Python 3.13
- Node.js
- npm
- Git
- Git LFS (required to download the RT-DETR model weights)

## Clone the repository

The RT-DETR model weights are stored with **Git LFS**. Install Git LFS
**before** cloning so the real weight files are downloaded — otherwise you
will only get small text pointer files instead of the actual `.pt` models:

```bash
git lfs install
```

Then clone:

```bash
git clone git@github.com:snaxb0b/Internship_Project.git
cd Internship_Project
```

If you already cloned the repository **without** Git LFS installed, run this
inside the project to fetch the real weight files:

```bash
git lfs install
git lfs pull
```

You can verify the weights are real files (not pointers) — each should be tens
of MB, not a few hundred bytes:

```bash
git lfs ls-files
```

## Backend setup

Create a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Copy the environment file:

```powershell
Copy-Item .env.example .env
```

Place the required YOLO weights in:

```text
weights/
```

Run the backend:

```powershell
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend setup

Open another PowerShell terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Backend tests

From the project root:

```powershell
python -m pytest
```

## Frontend production build

```powershell
cd frontend
npm run build
```

## Model weights

The RT-DETR weights used by the app (`weights/rtdetr-l.pt`,
`weights/rtdetr-x.pt`) are tracked with **Git LFS**, so they come with the
repository as long as Git LFS is installed (see
[Clone the repository](#clone-the-repository)). Without Git LFS you will only
get small pointer files, and the backend will fail to load the models.

Any other `.pt` files are not stored in Git — place them inside the
`weights/` directory manually, or let Ultralytics download them automatically
on first use.