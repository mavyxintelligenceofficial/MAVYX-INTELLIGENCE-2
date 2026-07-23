# Docker

The active `docker-compose.yml` lives at the **repository root** so that
`docker compose up` works from anywhere without extra flags.

This folder will hold:
- Per-service `Dockerfile`s as services are built (Phase 2+)
- Any docker-compose override files for CI vs local dev

Kubernetes manifests (for later, larger-scale deployment) will live in
`infrastructure/kubernetes/`, and Terraform/IaC definitions in
`infrastructure/terraform/`, per the Technical Architecture Document (Vol. III, Ch. 6-7).
