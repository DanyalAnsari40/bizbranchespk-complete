# Add SSH secrets so deploy can use rsync

The workflow fails with **"SSH deploy required"** when these repository secrets are missing.

## Steps (exact names – case-sensitive)

1. Open: **https://github.com/DigitalSkillsHouse/bizbranches-updated/settings/secrets/actions**
2. Click **"New repository secret"** for each:

| Secret name (copy exactly) | Value |
|---------------------------|--------|
| `SSH_HOST`                | Your server hostname, e.g. `bizbranches.pk` or `server123.hosting.com` |
| `SSH_USERNAME`            | Your cPanel / SSH username |
| `SSH_PRIVATE_KEY`        | Full private key content (from `bizbranches_deploy`), including `-----BEGIN ... KEY-----` and `-----END ... KEY-----` lines |

3. Optional (only if you need them):

| Secret name              | Example value   |
|--------------------------|-----------------|
| `SSH_PORT`               | `21098` (if not 22) |
| `SSH_REMOTE_WEB_ROOT`    | `public_html`   |
| `SSH_REMOTE_API_PATH`    | `public_html/api` |

4. Save. On the next push or workflow run, the **"Which SSH secrets are set?"** step will show SET/MISSING for each. All three required ones must show **SET** for rsync deploy to run.

## Check

- You must be in **Repository secrets**, not **Environment secrets**.
- Names are case-sensitive: `SSH_HOST` not `ssh_host` or `SSH Host`.
- No extra spaces in the secret **name** (the value can be multi-line for the key).
