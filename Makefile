.PHONY: help install dev build test lint format clean docker-up docker-down docker-logs

# Default target
help:
	@echo "MedhaOS Healthcare Platform - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build all applications"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Lint all code"
	@echo "  make format       - Format all code"
	@echo "  make type-check   - Run TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make docker-logs  - View Docker logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with test data"
	@echo "  make db-reset     - Reset database"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make tf-init      - Initialize Terraform"
	@echo "  make tf-plan      - Plan Terraform changes"
	@echo "  make tf-apply     - Apply Terraform changes"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make clean-all    - Clean everything including node_modules"

# Development commands
install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

type-check:
	npm run type-check

# Docker commands
docker-up:
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Services are ready!"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"
	@echo "Grafana: http://localhost:3001"
	@echo "Prometheus: http://localhost:9090"
	@echo "Jaeger: http://localhost:16686"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v
	docker system prune -f

# Database commands
db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

db-reset:
	npm run db:reset

# Infrastructure commands
tf-init:
	cd infrastructure/terraform && terraform init

tf-plan:
	cd infrastructure/terraform && terraform plan -var-file=terraform.tfvars

tf-apply:
	cd infrastructure/terraform && terraform apply -var-file=terraform.tfvars

tf-destroy:
	cd infrastructure/terraform && terraform destroy -var-file=terraform.tfvars

# Cleanup commands
clean:
	npm run clean
	find . -name "dist" -type d -exec rm -rf {} +
	find . -name "build" -type d -exec rm -rf {} +
	find . -name ".next" -type d -exec rm -rf {} +
	find . -name "coverage" -type d -exec rm -rf {} +

clean-all: clean
	rm -rf node_modules
	find . -name "node_modules" -type d -exec rm -rf {} +

# CI/CD
ci: install lint type-check test build

# Quick start
quickstart: docker-up install dev
