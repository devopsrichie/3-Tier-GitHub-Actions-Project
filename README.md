# 3-Tier GitHub Auction Project

A property auction platform for **Auction Central**, built as a classic 3-tier app and shipped with GitHub Actions, Jenkins, Docker, Kubernetes and Prometheus/Grafana.

```
 Browser ──▶  client  (React + nginx)     Presentation tier
                 │  /api/*
                 ▼
              api     (Node.js + Express)  Application tier   ──▶ /metrics ──▶ Prometheus ──▶ Grafana
                 │
                 ▼
              mysql   (MySQL 8)            Data tier
```

## Features
- Browse live, upcoming and closed property auctions (prices in ZAR)
- Register / log in (bcrypt + JWT)
- Place bids with minimum-increment rules; row locking prevents race conditions
- "My Bids" dashboard showing leading / outbid / won
- Admin page to publish new auctions
- Health checks, Prometheus metrics, HPA autoscaling

## Repo layout
| Path | What it is |
|---|---|
| `api/` | Express API, Jest tests, Dockerfile |
| `client/` | React (Vite) app, nginx config, multi-stage Dockerfile |
| `mysql-init/` | Schema + seed data (runs on first DB start) |
| `k8s-prod/` | Namespace, StorageClass (`sc.yaml`), Secret, ConfigMap, MySQL StatefulSet, API & client Deployments, HPA, Ingress |
| `Monitoring/` | Prometheus/Grafana steps + ServiceMonitor |
| `.github/workflows/ci-cd.yml` | GitHub Actions: test → scan → build/push → deploy → Slack |
| `Jenkinsfile_CICD` | Equivalent Jenkins pipeline |
| `Jenkinsfile-slack_notifications` | Jenkins pipeline with Slack alerts |
| `Jenkins Slack Setup.md` | How to wire Jenkins to Slack |
| `docker-compose.yml` | Run all three tiers locally |

## 1. Run locally (Docker Compose)
```bash
docker compose up --build
```
- App: http://localhost:3000
- API: http://localhost:5000/api/health
- Admin login: `admin@auctioncentral.local` / `Admin@12345` — **change this before going live**

Without Docker: start MySQL and load `mysql-init/init.sql`, then
```bash
cd api && cp .env.example .env && npm install && npm run dev
cd client && npm install && npm run dev     # http://localhost:3000
```

## 2. Deploy to Kubernetes (manual)
Works on any cluster (minikube, kind, k3s, EKS, GKE, AKS). Check the provisioner in `k8s-prod/sc.yaml` first.
```bash
kubectl apply -f k8s-prod/namespace.yaml
kubectl apply -f k8s-prod/sc.yaml
kubectl apply -f k8s-prod/secrets.yaml          # edit the values first!
kubectl apply -f k8s-prod/configmap.yaml
kubectl create configmap mysql-init -n auction --from-file=init.sql=mysql-init/init.sql
kubectl apply -f k8s-prod/mysql.yaml
# replace DOCKERHUB_USERNAME in api.yaml / client.yaml with your Docker Hub user, then:
kubectl apply -f k8s-prod/api.yaml -f k8s-prod/client.yaml
kubectl get svc client -n auction               # open the EXTERNAL-IP
```
On minikube/kind, use `kubectl port-forward svc/client 8080:80 -n auction`.

## 3. GitHub Actions setup
Repo → **Settings → Secrets and variables → Actions** → add:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `KUBECONFIG_B64` | `base64 -w0 ~/.kube/config` |
| `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET` | Strong random values |
| `SLACK_WEBHOOK_URL` | *(optional)* Slack incoming webhook |

Pull requests run tests, client build and Trivy scan. Pushes to `main` also build/push images tagged with the commit SHA, deploy to the cluster and post to Slack.

## 4. Jenkins setup
See `Jenkins Slack Setup.md` for plugins and credential IDs, then point a Pipeline job at `Jenkinsfile_CICD` or `Jenkinsfile-slack_notifications`.

## 5. Monitoring
Follow `Monitoring/steps.txt` to install kube-prometheus-stack and scrape the API.

## API reference
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/health` | – |
| POST | `/api/auth/register` · `/api/auth/login` | – |
| GET | `/api/auctions?status=live\|upcoming\|closed` | – |
| GET | `/api/auctions/:id` | – |
| POST | `/api/auctions` | admin |
| POST | `/api/auctions/:id/bids` `{ amount }` | bidder |
| GET | `/api/users/me/bids` | bidder |
| GET | `/metrics` | – |
