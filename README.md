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

## Clone the repository

```bash
git clone git@github.com:snaxb0b/Internship_Project.git
cd Internship_Project
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

YOLO model files are not stored in Git.

Place the required `.pt` files inside the `weights/` directory before
running predictions.