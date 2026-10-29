# Jenkins → Slack Setup

Used by `Jenkinsfile-slack_notifications`.

## 1. Create the Slack app
1. Go to https://api.slack.com/apps → **Create New App** → *From scratch*.
2. Name it `Jenkins Auction CI` and choose your workspace.
3. **OAuth & Permissions** → add Bot Token Scopes: `chat:write`, `chat:write.public`.
4. **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-...`).
5. In Slack, create `#auction-deployments` and run `/invite @Jenkins Auction CI`.

## 2. Configure Jenkins
1. **Manage Jenkins → Plugins** → install **Slack Notification**.
2. **Manage Jenkins → Credentials** → add *Secret text*, ID `slack-token`, value = the `xoxb-` token.
3. **Manage Jenkins → System → Slack**:
   - Workspace: your Slack subdomain (e.g. `auctioncentral`)
   - Credential: `slack-token`
   - Default channel: `#auction-deployments`
   - Click **Test Connection** — a test message should appear in the channel.

## 3. Other credentials the pipelines expect
| ID | Type | Value |
|---|---|---|
| `dockerhub-creds` | Username/Password | Docker Hub user + access token |
| `kubeconfig` | Secret file | kubeconfig for the cluster |
| `auction-db-pass` | Secret text | MySQL app user password |
| `auction-root-pass` | Secret text | MySQL root password |
| `auction-jwt` | Secret text | JWT signing secret |

Also add a **NodeJS** tool named `node20` (Manage Jenkins → Tools).

## 4. Create the pipeline job
New Item → **Multibranch Pipeline** (or Pipeline) → SCM: this GitHub repo → Script path: `Jenkinsfile-slack_notifications`.
