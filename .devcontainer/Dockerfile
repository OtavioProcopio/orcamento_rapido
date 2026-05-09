FROM mcr.microsoft.com/devcontainers/javascript-node:20

RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces/gerador-orcamento