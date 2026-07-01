# Bravas Digital

Marketing site for Bravas — "Marketing Without Fluff. Just Flavour."

## Structure

- `index.html` — page markup; loads Inter + Fraunces from Google Fonts and Lenis/GSAP/ScrollTrigger/SplitText from jsdelivr
- `styles.css` — a 3-tier type scale (`--text-sm/md/lg`), Fraunces (headlines) + Inter (everything else), nav/drawer/scroll-progress chrome. No CSS-driven scroll-reveal classes — entrance animation is owned entirely by script.js/GSAP so content stays visible even if the CDN scripts fail to load
- `script.js` — nav behaviour, count-up stats, magnetic buttons (unchanged); Lenis smooth scroll with a low lerp for cinematic deceleration; GSAP SplitText line-mask reveals for h1/h2 headlines; ScrollTrigger-driven scale+fade entrance for cards/stats/logos. Everything GSAP/Lenis-related is feature-detected (`typeof window.Lenis`, `typeof window.gsap`) and wrapped in a `prefers-reduced-motion` check, so the page degrades to fully visible, statically-styled content with native anchor scrolling if the CDN is unreachable or the user has reduced motion enabled

## Local run

You can run a local static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Netlify deployment

This repo is configured for static deployment on Netlify using `netlify.toml`.

### Option A: Connect repo in Netlify UI

1. In Netlify, choose **Add new site** → **Import an existing project**.
2. Connect your Git provider and select this repo.
3. Use these settings:
   - **Build command**: *(leave empty)*
   - **Publish directory**: `.`
4. Deploy.

### Option B: GitHub Actions auto-deploy

A workflow exists at `.github/workflows/netlify-deploy.yml`.

Add these repository secrets:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Then pushes to branch `work` will deploy to Netlify production.
