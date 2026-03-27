# Overview

This is a completely new app for your OpenMower robotic lawnmower.

At this time, "only" the map editor and some debug information are enabled.

# Installation

## OpenMowerOS v2

1. Go to `http://<mower-ip>:5001/compose/openmower` in your browser.
2. Switch to edit mode.
3. In the `compose.yaml` editor, add the following lines above the `# Dockge-specific extras shown in the UI` line:

   ```yaml
     app:
       image: ghcr.io/xtech/openmower-app:edge
       container_name: app
       ports:
         - 3000:3000
       restart: unless-stopped
   ```

   Double-check the indentation, `app` should be indented 2 spaces, just like the other containers.

4. Add the new URL:
   ```yaml
   x-dockge:
     urls:
       - http://${HOSTNAME}:8080
       - http://${HOSTNAME}:3000
   ```
5. Click the `Deploy` button.

You can now access the app at `http://<mower-ip>:3000` in your browser.

## OpenMowerOS legacy

For the legacy OpenMowerOS image you need to create a systemd service. Create a file at `/etc/systemd/system/openmower-app.service` with the following content:

```
[Unit]
Description=Podman container - openmower-app.service
Documentation=man:podman-generate-systemd(1)
Wants=network.target
After=network-online.target NetworkManager.service
StartLimitInterval=120
StartLimitBurst=10

[Service]
Environment=PODMAN_SYSTEMD_UNIT=%n
Type=forking
Restart=always
RestartSec=15s
TimeoutStartSec=1h
TimeoutStopSec=120s

ExecStartPre=/bin/rm -f %t/container-openmower-app.pid %t/container-openmower-app.ctr-id

ExecStart=/usr/bin/podman run --conmon-pidfile %t/container-openmower-app.pid --cidfile %t/container-openmower-app.ctr-id --cgroups=no-conmon \
  --replace --detach --tty \
  --name openmower-app \
  --publish 3000:3000/tcp \
  --label io.containers.autoupdate=image \
  ghcr.io/xtech/openmower-app:edge

ExecStop=/usr/bin/podman stop --ignore --cidfile %t/container-openmower-app.ctr-id -t 10
ExecStopPost=/usr/bin/podman rm --ignore --force --cidfile %t/container-openmower-app.ctr-id
PIDFile=%t/container-openmower-app.pid

[Install]
WantedBy=multi-user.target default.target
```

Then enable the service and start it:
```bash
sudo systemctl enable --now openmower-app.service
```

You can now access the app at `http://<mower-ip>:3000` in your browser.
