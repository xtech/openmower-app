# Overview

This is a completely new app for your OpenMower robotic lawnmower.

At this time, "only" the map editor and some debug information are enabled.

# Installation

This assumes you're on a recent OpenMowerOS v2 image.

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
