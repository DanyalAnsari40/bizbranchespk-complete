# Add SSH secrets so deploy can use rsync

The workflow fails with **"SSH deploy required"** when these repository secrets are missing.  
**SSH port:** Default is 22. Many cPanel hosts use a **custom port** (e.g. 21098). Check cPanel → Security → SSH Access for the port; if it’s not 22, add secret `SSH_PORT` with that value (e.g. `21098`). "Connection refused" often means the wrong port.

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
| `SSH_PORT`               | Port from cPanel → SSH Access (e.g. `21098`). Omit = 22. If you get "Connection refused", set this. |
| `SSH_REMOTE_WEB_ROOT`    | `public_html`   |
| `SSH_REMOTE_API_PATH`    | `public_html/api` |

4. Save. On the next push or workflow run, the **"Which SSH secrets are set?"** step will show SET/MISSING for each. All three required ones must show **SET** for rsync deploy to run.

## Check

- You must be in **Repository secrets**, not **Environment secrets**.
- Names are case-sensitive: `SSH_HOST` not `ssh_host` or `SSH Host`.
- No extra spaces in the secret **name** (the value can be multi-line for the key).

## "Connection refused" – what to try

1. **Use the server hostname for `SSH_HOST`**  
   Many hosts require the **server hostname** (e.g. `server123.hosting.com` or `box456.example.com`), not your domain `bizbranches.pk`. In cPanel check the address shown for SSH/SFTP (often under **SSH Access** or **FTP Accounts** / connection info). Use that host in the `SSH_HOST` secret.

2. **Confirm the port**  
   In the workflow log you’ll see: `host length=X chars, port length=Y chars`. Port length 2 → port is `22`; 5 → `21098`. In cPanel → **Security** → **SSH Access** confirm the port and set `SSH_PORT` to that exact number (no spaces).

3. **Firewall / IP blocking**  
   If host and port are correct and you still get “Connection refused”, your host may be blocking SSH from GitHub’s IPs. Ask your host to allow **outbound SSH from GitHub Actions** (or whitelist the region). No FTP fallback – deploy is SSH-only.
