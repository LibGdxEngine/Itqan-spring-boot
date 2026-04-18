.PHONY: prod-build

prod-build:
	COMPOSE_PROFILES=prod docker compose --env-file .env.production up -d --build
