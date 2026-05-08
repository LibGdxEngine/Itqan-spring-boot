.PHONY: prod-build dev-build dev-up dev-down dev-stop dev-restart dev-logs dev-ps dev-clean

prod-build:
	COMPOSE_PROFILES=prod docker compose --env-file .env.production up -d --build

dev-build:
	COMPOSE_PROFILES=dev docker compose --env-file .env up -d --build

dev-up:
	COMPOSE_PROFILES=dev docker compose --env-file .env up -d

dev-down:
	COMPOSE_PROFILES=dev docker compose --env-file .env down

dev-stop:
	COMPOSE_PROFILES=dev docker compose --env-file .env stop

dev-restart:
	COMPOSE_PROFILES=dev docker compose --env-file .env restart

dev-logs:
	COMPOSE_PROFILES=dev docker compose --env-file .env logs -f

dev-ps:
	COMPOSE_PROFILES=dev docker compose --env-file .env ps

dev-clean:
	COMPOSE_PROFILES=dev docker compose --env-file .env down -v
