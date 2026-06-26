# Blog setup (Sanity CMS)

The blog is built and live in the code. To turn it on and let Paul post, you
need a free **Sanity** project and three environment variables. ~10 minutes.

## 1. Create a free Sanity project

1. Go to **https://www.sanity.io** and sign up (Google/GitHub/email — free "Growth" tier is plenty).
2. Create a **new project**. Name it e.g. `Jesus Boot Camp`.
3. When asked for a dataset, use **`production`** and keep it **public** (default).
4. Copy the **Project ID** — a short string like `abc12xyz`. You'll need it next.

## 2. Allow the website to read from Sanity (CORS)

In **sanity.io/manage → your project → API → CORS origins**, add these (tick
"Allow credentials" for each):

- `https://jesusbootcamp.org`
- `https://www.jesusbootcamp.org`
- `http://localhost:3000`

## 3. Set the environment variables

Add these three variables (same values everywhere):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
```

- **Locally:** add them to the `.env.local` file in the project root.
- **Production (Vercel):** Project → **Settings → Environment Variables** → add all
  three for **Production, Preview, and Development**, then **redeploy**.

That's it — the blog will start showing posts and `/studio` will connect.

## 4. How Paul posts (the editor)

1. Go to **https://jesusbootcamp.org/studio** (or `http://localhost:3000/studio` locally).
2. Log in with the **same Sanity account** (invite others in sanity.io/manage → Members).
3. Click **Blog Post → Create new**, fill in:
   - **Title**, then click **Generate** next to Slug
   - **Main image**, **Excerpt** (short summary), **Body** (rich text + images)
   - Optionally set/keep **Published at**
4. Click **Publish**. The post appears at **/blog** within ~1 minute.

> Posts only show once their **Published at** date has passed, so you can schedule
> ahead. The list at `/blog` and each post page refresh automatically every minute.

## Notes

- `/studio` is excluded from Google (robots `noindex`) — it's the private editor.
- Until the env vars are set, `/blog` shows a tidy "Posts are coming soon" message
  and the rest of the site is unaffected.
- No database to manage and no extra cost on Sanity's free tier for this volume.
