SHELL := /bin/bash

APP_DIR := app
BASE_URL ?= http://localhost:5173
CYPRESS_BASE_URL ?= $(BASE_URL)
DEV_PID_FILE := .make-vite.pid
DEV_STARTED_FILE := .make-vite.started
COLOR_RESET := \033[0m
COLOR_BLUE := \033[1;34m
COLOR_GREEN := \033[1;32m
COLOR_RED := \033[1;31m
COLOR_YELLOW := \033[1;33m
MIN_COVERAGE_BRANCHES ?= 90
MIN_COVERAGE_FUNCTIONS ?= 90
MIN_COVERAGE_LINES ?= 90
MIN_COVERAGE_STATEMENTS ?= 90
JEST_TEST_FLAGS := --runInBand --silent --noStackTrace --colors
JEST_RESULTS_FILE := $(APP_DIR)/coverage/jest-results.json
JEST_COVERAGE_FLAGS := $(JEST_TEST_FLAGS) --coverage --coverageReporters=text-summary --coverageReporters=json-summary --json --outputFile=coverage/jest-results.json
VERSION ?=

.PHONY: help install lint test coverage build e2e dev-up dev-down check validate release clean

help:
	@echo "Targets:"
	@echo "  make install    - instala dependencias do app"
	@echo "  make lint       - roda eslint"
	@echo "  make test       - roda testes Jest"
	@echo "  make coverage   - roda Jest com cobertura"
	@echo "  make build      - gera build de producao"
	@echo "  make dev-up     - sobe o Vite em background na porta padrao"
	@echo "  make dev-down   - derruba o Vite iniciado pelo Makefile"
	@echo "  make e2e        - sobe o app, roda Cypress e derruba o app"
	@echo "  make check      - lint + test + coverage + build"
	@echo "  make validate   - lint + test + coverage + build"
	@echo "  make release VERSION=v0.1.0 - cria tag semântica anotada"
	@echo "  make clean      - remove artefatos locais do Makefile"

install:
	cd $(APP_DIR) && npm install

lint:
	cd $(APP_DIR) && npm run lint

test:
	@set -e; \
	printf "$(COLOR_BLUE)==> Testes Jest$(COLOR_RESET)\n"; \
	if cd $(APP_DIR) && npm test -- $(JEST_TEST_FLAGS); then \
		printf "$(COLOR_GREEN)✓ Testes concluídos com sucesso$(COLOR_RESET)\n"; \
	else \
		printf "$(COLOR_RED)✗ Testes falharam$(COLOR_RESET)\n"; \
		exit 1; \
	fi

coverage:
	@set -e; \
	printf "$(COLOR_BLUE)==> Cobertura Jest$(COLOR_RESET)\n"; \
	rm -rf $(APP_DIR)/coverage; \
	status=0; \
	summary_status=0; \
	set +e; \
	( cd $(APP_DIR) && npm test -- $(JEST_COVERAGE_FLAGS) ); \
	status=$$?; \
	set -e; \
	if [ -f $(APP_DIR)/coverage/coverage-summary.json ]; then \
		MIN_COVERAGE_BRANCHES=$(MIN_COVERAGE_BRANCHES) \
		MIN_COVERAGE_FUNCTIONS=$(MIN_COVERAGE_FUNCTIONS) \
		MIN_COVERAGE_LINES=$(MIN_COVERAGE_LINES) \
		MIN_COVERAGE_STATEMENTS=$(MIN_COVERAGE_STATEMENTS) \
		node $(APP_DIR)/scripts/coverage-summary.mjs $(APP_DIR)/coverage/coverage-summary.json || summary_status=$$?; \
	else \
		printf "$(COLOR_YELLOW)! Resumo de cobertura indisponível$(COLOR_RESET)\n"; \
		summary_status=1; \
	fi; \
	if [ $$status -ne 0 ] || [ $$summary_status -ne 0 ]; then \
		printf "$(COLOR_RED)✗ Cobertura abaixo da meta ou suíte com falha$(COLOR_RESET)\n"; \
		exit 1; \
	fi; \
	printf "$(COLOR_GREEN)✓ Cobertura dentro da meta$(COLOR_RESET)\n"

build:
	cd $(APP_DIR) && npm run build

dev-up:
	@if curl -fsS "$(BASE_URL)" >/dev/null 2>&1; then \
		rm -f $(DEV_STARTED_FILE) $(DEV_PID_FILE); \
		echo "Vite ja esta disponivel em $(BASE_URL)"; \
	elif [ -f $(DEV_PID_FILE) ] && kill -0 "$$(cat $(DEV_PID_FILE))" 2>/dev/null; then \
		echo "Vite ja esta rodando com PID $$(cat $(DEV_PID_FILE))"; \
	else \
		( cd $(APP_DIR) && nohup npm run dev > "$(CURDIR)/.make-vite.log" 2>&1 & echo $$! > "$(CURDIR)/$(DEV_PID_FILE)" ); \
		echo "1" > $(DEV_STARTED_FILE); \
		echo "Subindo Vite..."; \
	fi
	@for attempt in $$(seq 1 30); do \
		if curl -fsS "$(BASE_URL)" >/dev/null 2>&1; then \
			echo "Vite pronto em $(BASE_URL)"; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Vite nao respondeu em $(BASE_URL)"; \
	exit 1

dev-down:
	@if [ ! -f $(DEV_STARTED_FILE) ]; then \
		echo "Vite externo preservado"; \
	elif [ -f $(DEV_PID_FILE) ]; then \
		pid="$$(cat $(DEV_PID_FILE))"; \
		if kill -0 "$$pid" 2>/dev/null; then \
			kill "$$pid" 2>/dev/null || true; \
			wait "$$pid" 2>/dev/null || true; \
			echo "Vite finalizado (PID $$pid)"; \
		fi; \
		rm -f $(DEV_PID_FILE); \
		rm -f $(DEV_STARTED_FILE); \
	else \
		echo "Nenhum Vite iniciado pelo Makefile"; \
	fi

e2e:
	@set -e; \
	trap '$(MAKE) -C $(CURDIR) dev-down' EXIT; \
	$(MAKE) dev-up; \
	cd $(APP_DIR) && CYPRESS_BASE_URL=$(CYPRESS_BASE_URL) npm run cy:run

check: validate

validate:
	@set -e; \
	lint_status=ok; \
	test_status=ok; \
	coverage_status=ok; \
	build_status=ok; \
	printf "$(COLOR_BLUE)==> Lint$(COLOR_RESET)\n"; \
	if ! $(MAKE) --no-print-directory lint; then \
		lint_status=fail; \
		printf "$(COLOR_RED)✗ Lint falhou$(COLOR_RESET)\n"; \
	else \
		printf "$(COLOR_GREEN)✓ Lint OK$(COLOR_RESET)\n"; \
	fi; \
	printf "$(COLOR_BLUE)==> Testes unitários$(COLOR_RESET)\n"; \
	if ! $(MAKE) --no-print-directory test; then \
		test_status=fail; \
		printf "$(COLOR_RED)✗ Testes falharam$(COLOR_RESET)\n"; \
	else \
		printf "$(COLOR_GREEN)✓ Testes OK$(COLOR_RESET)\n"; \
	fi; \
	printf "$(COLOR_BLUE)==> Cobertura$(COLOR_RESET)\n"; \
	if ! $(MAKE) --no-print-directory coverage; then \
		coverage_status=fail; \
		printf "$(COLOR_RED)✗ Cobertura falhou$(COLOR_RESET)\n"; \
	else \
		printf "$(COLOR_GREEN)✓ Cobertura OK$(COLOR_RESET)\n"; \
	fi; \
	printf "$(COLOR_BLUE)==> Build$(COLOR_RESET)\n"; \
	if ! $(MAKE) --no-print-directory build; then \
		build_status=fail; \
		printf "$(COLOR_RED)✗ Build falhou$(COLOR_RESET)\n"; \
	else \
		printf "$(COLOR_GREEN)✓ Build OK$(COLOR_RESET)\n"; \
	fi; \
	printf "\n"; \
	VALIDATE_LINT_STATUS=$$lint_status \
	VALIDATE_TEST_STATUS=$$test_status \
	VALIDATE_COVERAGE_STATUS=$$coverage_status \
	VALIDATE_BUILD_STATUS=$$build_status \
	VALIDATE_COVERAGE_FILE=$(APP_DIR)/coverage/coverage-summary.json \
	VALIDATE_TEST_RESULTS_FILE=$(JEST_RESULTS_FILE) \
	VALIDATE_BUILD_DIR=$(APP_DIR)/dist \
	MIN_COVERAGE_BRANCHES=$(MIN_COVERAGE_BRANCHES) \
	MIN_COVERAGE_FUNCTIONS=$(MIN_COVERAGE_FUNCTIONS) \
	MIN_COVERAGE_LINES=$(MIN_COVERAGE_LINES) \
	MIN_COVERAGE_STATEMENTS=$(MIN_COVERAGE_STATEMENTS) \
	node $(APP_DIR)/scripts/validate-report.mjs

release:
	@set -e; \
	if [ -z "$(VERSION)" ]; then \
		echo "Uso: make release VERSION=v0.1.0"; \
		exit 1; \
	fi; \
	if ! printf '%s' "$(VERSION)" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$$'; then \
		echo "Versão inválida: $(VERSION). Use o formato vX.Y.Z"; \
		exit 1; \
	fi; \
	if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
		echo "Este diretório não é um repositório Git."; \
		exit 1; \
	fi; \
	if [ -n "$$(git status --short)" ]; then \
		echo "Existem alterações não commitadas. Faça commit antes de gerar a tag."; \
		exit 1; \
	fi; \
	if git rev-parse "$(VERSION)" >/dev/null 2>&1; then \
		echo "A tag $(VERSION) já existe."; \
		exit 1; \
	fi; \
	git tag -a "$(VERSION)" -m "release: $(VERSION)"; \
	echo "Tag $(VERSION) criada com sucesso."

clean: dev-down
	rm -f .make-vite.log $(DEV_PID_FILE) $(DEV_STARTED_FILE)
