# MHWilds Gogma Reroll Tracker

A web app for tracking Monster Hunter Wilds **Gogma Artian Weapon** rerolls. This app attempts to help you track your rolls across all your weapons, so you can plan your grind more effectively.

---

## Usage

This app runs locally on your computer and opens in your browser — no account, no cloud, no internet required after setup. Your data stays on your machine.

There are three ways to run it. Pick the one that's easier for you:

| | [Option A: Docker](#option-a-docker-local-easiest) | [Option B: Bun](#option-b-bun-local-more-involved) | [Option C: Hosted](#option-c-hosted-easiest) | 
|---|---|---|---|
| **What you install** | Docker Desktop | Bun runtime | Nothing | 
| **What you download** | Just the `docker-compose.yml` file | The full repository | Nothing | 
| **App runs at** | http://localhost:5173 | http://localhost:5173 | https://mhwildsgogmarerolltracker.gegeh.dev | 
| **Best for** | Most players who prefer local | Players comfortable with a terminal | Just want to use it now | 

---

## Option A: Docker (local, easiest)

Docker is just a software for deploying applications inside lightweight, isolated containers. Docker has a GUI called **Docker Desktop** that works on Windows, Mac, and Linux. You don't need to know anything about Docker to use this app — just follow the steps below and it will be up and running in no time.

---

### Step 1 — Install Docker

Download Docker Desktop here: **https://www.docker.com/products/docker-desktop/**

After installing, open Docker Desktop and leave it running in the background. You'll see a Docker icon in your system tray (Windows) or menu bar (Mac). It needs to be running whenever you want to use the tracker.

---

### Step 2 — Download the compose file

Download the [`docker-compose.yml`](docker-compose.yml) file from this repository and save it somewhere easy to find — for example, create a folder called `gogma-tracker` on your Desktop and put it there.

---

### Step 3 — Start the app

Open a terminal in the folder where you saved `docker-compose.yml`:

- **Windows**: Open the folder in File Explorer, then right-click an empty area and choose **"Open in Terminal"** (or search for "Command Prompt" / "PowerShell" in the Start menu, then `cd` to your folder)
- **Mac/Linux**: Open Terminal and `cd` to the folder

Then run:

```bash
docker compose pull
docker compose up -d
```

The first run will download the app image. This only happens once.

Once it's done, open your browser and go to: **http://localhost:5173**

The tracker should be up and running.

> **Note:** If port 5173 is already in use, you can choose a different port. Create a file called `.env` next to your `docker-compose.yml` with this content:
> ```
> PORT=8080
> ```
> Then visit **http://localhost:8080** instead.

---

### Stopping the app

To stop the tracker:

```bash
docker compose down
```

Your data is safe — it's stored in a Docker volume and will still be there when you start it again.

---

### Starting again later

Any time you want to use the tracker again, just make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

---

### Updating to a newer version

```bash
docker compose pull
docker compose up -d
```

That's it. Your saved data is never touched during updates.

---

### Using Docker Desktop (no command line)

If you prefer not to use a terminal at all, Docker Desktop has a GUI:

1. Open **Docker Desktop**
2. Go to the **Containers** tab — you should see `gogma-tracker` listed after the first run
3. Use the ▶ / ■ buttons to start/stop it
4. To update, go to **Images**, find the tracker image, and click **Pull** to get the latest version, then restart the container

For the very first setup you still need to run `docker compose pull` and `docker compose up -d` once from the terminal, as Docker Desktop doesn't directly handle `docker-compose.yml` files without that initial step.

---

### Data location

Your rolls are stored in a Docker volume called `tracker_data`. Docker manages this automatically — the data persists across restarts and updates, and is never deleted unless you explicitly remove the volume.

To back up your data, you can copy the SQLite database file out of the volume:

```bash
docker run --rm -v tracker_data:/data -v "$(pwd):/backup" alpine cp /data/tracker.db /backup/tracker.db
```

This saves a `tracker.db` file in your current folder.

---

## Option B: Bun (local, more involved)

This method runs the app directly on your machine using **Bun**, a JavaScript runtime. It's slightly more involved to set up but doesn't require Docker.

---

### Step 1 — Install Bun

- **Windows**: Open PowerShell and run:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **Mac/Linux**: Open Terminal and run:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

After installing, close and reopen your terminal so the `bun` command is available. You can view more here: **https://bun.com/docs/installation**

---

### Step 2 — Download the repository

Download this repository as a ZIP file (click the green **Code** button on GitHub → **Download ZIP**), then extract it to a folder of your choice.

Alternatively, if you have Git installed:

```bash
git clone --depth 1 https://github.com/gegehprast/mhwilds-gogma-reroll-tracker.git
cd mhwilds-gogma-reroll-tracker
```

---

### Step 3 — Run the start script

Open a terminal in the folder where you extracted/cloned the repository.

**Windows (PowerShell):**

> If you get an error about "execution policy", run this once first, then try again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

```powershell
.\start.ps1
```

**Mac/Linux:**

```bash
./start.sh
```

The first run will install dependencies and build the frontend — this takes a minute or two. Once it's ready, you'll see:

```
✅ Ready!

   Open http://localhost:5173 in your browser
```

Open **http://localhost:5173** in your browser.

Press `Ctrl+C` in the terminal to stop the app.

---

### Stopping the app

Press `Ctrl+C` in the terminal where the app is running.

---

### Starting again later

Just run the same script again from the same folder:

```bash
# Mac/Linux
./start.sh

# Windows
.\start.ps1
```

Dependencies are already installed, the database is already set up, and the frontend build is cached — so it starts much faster after the first run.

---

### Updating the app

**If you used Git:**

```bash
git pull
```

Then restart with the `--rebuild` flag to rebuild the frontend:

```bash
# Mac/Linux
./start.sh --rebuild

# Windows
.\start.ps1 -Rebuild
```

**If you downloaded the ZIP:**

1. Back up your data first — copy `apps/backend/data/tracker.db` somewhere safe
2. Download the new ZIP from GitHub and extract it to a **new** folder
3. Copy your `tracker.db` back into `apps/backend/data/` in the new folder
4. Run the start script normally:
```bash
# Mac/Linux
./start.sh

# Windows
.\start.ps1
```

---

### Data location

Your rolls are saved in `apps/backend/data/tracker.db` inside the repository folder. Back this file up if you want to preserve your data.

---

## Option C: Hosted (easiest)

The easiest way — no installation required. Just open your browser and go to:

👉 **https://mhwildsgogmarerolltracker.gegeh.dev**

This is a public instance hosted by me. A few things worth knowing:

- **No account or login required** — you can start tracking immediately
- **No sensitive data is collected** — the app does not ask for personal information and does not track you. Your roll data is stored anonymously on the server.
- **Your roll data is saved** on the server tied to your browser session, so you can pick up where you left off as long as you use the same browser. You also get a unique code that you can use to access your data from another device or browser.
- The server may occasionally go down for maintenance or updates

If you'd prefer your data to stay entirely on your own machine, use one of the local options.

---

## Developers
