.PHONY: dev down build logs shell-backend shell-frontend

# Development
dev:
	cd infra && docker-compose up -d

dev-build:
	cd infra && docker-compose up -d --build

down:
	cd infra && docker-compose down

restart:
	cd infra && docker-compose restart

# Production
prod:
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-down:
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Logs
logs:
	cd infra && docker-compose logs -f

logs-backend:
	cd infra && docker-compose logs -f backend

logs-worker:
	cd infra && docker-compose logs -f celery-worker

# Shell access
shell-backend:
	cd infra && docker-compose exec backend sh

shell-frontend:
	cd infra && docker-compose exec frontend sh

shell-db:
	cd infra && docker-compose exec postgres psql -U mikrowize

# Backend local dev (without Docker)
backend-local:
	cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend local dev (without Docker)
frontend-local:
	cd frontend && npm install && npm run dev

# Clean everything
clean:
	cd infra && docker-compose down -v --rmi all
	docker system prune -f
