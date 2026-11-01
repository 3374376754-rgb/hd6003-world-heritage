# The Shape of World Heritage

A static visual essay for **HD6003 Applications of AI in Digital Humanities**.

It uses the **UNESCO World Heritage List 2019** snapshot (1,121 records, 22 columns, CC0) to describe the list across region, category, and inscription year. The charts are drawn from the same cleaned CSV used in the Orange workflow.

## Pages

- `index.html` — the visual essay
- `styles.css` — design and responsive layout
- `app.js` — interactions, tooltips, presenter cue
- `data.js` — aggregated data generated from the CSV

## GitHub Pages

1. Create a public repository on GitHub.
2. Upload the contents of this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. The site will be available at `https://<username>.github.io/<repository>/`.

No build step is required. The site is plain HTML, CSS, and JavaScript.

## Data

UNESCO World Heritage List 2019, via Kaggle:  
https://www.kaggle.com/datasets/ujwalkandi/unesco-world-heritage-sites

License: CC0 Public Domain. The 2019 snapshot is not the current 2026 list.

## Method

Descriptive analytics only. The three views are a Sieve Diagram, a Mosaic Display, and a Violin Plot. No model training, no prediction, and no causal claims. Three multi-region records are kept in the totals but omitted from the two-dimensional charts for readability.

## Presenter cue

The **Presenter cue** button reveals the Chinese rehearsal cue that corresponds to the current section of the video script. It is off by default and can be closed at any time.

## Credits

Course: HD6003 Applications of AI in Digital Humanities · 2026 Semester 1.  
Tool: Orange Data Mining.  
Data: UNESCO World Heritage List 2019, via Kaggle (CC0).
