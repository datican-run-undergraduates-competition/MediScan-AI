# AI Medical System Backend

This is the backend service for the AI Medical System, providing APIs for medical image and report analysis.

## Features

- User authentication and authorization
- Medical image analysis (X-ray, MRI, CT)
- Medical report analysis
- Asynchronous processing of uploads
- Dashboard statistics
- User settings management

## Prerequisites

- Python 3.8+
- PostgreSQL
- CUDA-capable GPU (optional, for faster processing)

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/ai_medical_system
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

4. Initialize the database:
```bash
alembic upgrade head
```

## Running the Application

1. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── endpoints/
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   └── models.py
│   ├── schemas/
│   │   └── schemas.py
│   ├── services/
│   │   └── analysis.py
│   ├── tasks.py
│   ├── scheduler.py
│   └── main.py
├── alembic/
│   └── versions/
├── tests/
├── .env
├── requirements.txt
└── README.md
```

## Testing

Run tests using pytest:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
