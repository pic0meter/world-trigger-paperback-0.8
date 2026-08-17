# World Trigger Chapters — Paperback 0.8

A Paperback **0.8** third-party source for:

https://world-trigger-chapters.online/

## Features

- World Trigger search
- Manga metadata
- Complete chapter list
- Decimal chapters such as 39.5 and 45.5
- Chapter reader image extraction
- Manga share URL
- GitHub Pages-compatible Paperback bundle

The target site currently exposes World Trigger chapters from Chapter 1 through its latest indexed chapter and uses `/comic/world-trigger-chapter-N/` chapter pages.

## Build

Requires Node.js and npm.

```bash
npm install
npm run bundle
```

The Paperback 0.8 toolchain generates the repository bundle under `bundles/`.

For local testing:

```bash
npm run serve
```

## Publishing

Publish the generated `bundles/` directory as the root of a GitHub Pages site.

Then add the resulting URL to:

**Paperback → Settings → External Sources → +**

The URL should end in:

```text
/0.8/
```

if you structure your Pages deployment that way.

## Copyright

This extension does not contain or redistribute manga pages. It requests pages from the configured website at read time.

The target site states that its translations are fan-made and asks readers to support official releases where available. Use this extension only where lawful and respect copyright, terms of service, and takedown requests.

This project is not affiliated with Paperback, Shueisha, Daisuke Ashihara, VIZ Media, or the target website.
