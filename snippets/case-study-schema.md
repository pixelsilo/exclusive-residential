# Case study schema (paste in the Designer)

Webflow's API saves CMS tokens in the schema field but doesn't fill them in, so this is pasted by hand. Steps:

1. Open the **Case Studies Template** page settings and find **Schema markup**.
2. Paste the JSON below.
3. Replace each `[FIELD]` placeholder with the CMS field using **+ Add field**:
   - `[Slug]`
   - `[Name]` (three places)
   - `[Meta Description]`
   - `[Headline]`
   - `[Display Address]`
4. Save, publish to staging, then check the page source shows real values. The Rich Results Test should say the JSON is valid.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "url": "https://excl.group/case-studies/[Slug]",
      "name": "[Name] | Exclusive Construction Group",
      "description": "[Meta Description]",
      "isPartOf": { "@id": "https://excl.group/#website" },
      "about": {
        "@type": "CreativeWork",
        "name": "[Name]",
        "description": "[Headline]",
        "genre": "Construction project",
        "creator": {
          "@type": "GeneralContractor",
          "@id": "https://excl.group/#organization",
          "name": "Exclusive Construction Group",
          "url": "https://excl.group/"
        },
        "locationCreated": {
          "@type": "Place",
          "name": "[Display Address]",
          "address": { "@type": "PostalAddress", "addressLocality": "London", "addressCountry": "GB" }
        }
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://excl.group/" },
        { "@type": "ListItem", "position": 2, "name": "Portfolio", "item": "https://excl.group/portfolio" },
        { "@type": "ListItem", "position": 3, "name": "[Name]" }
      ]
    }
  ]
}
```

`https://excl.group` is assumed to be the live domain (it matches the contact email). Change every URL here and in the static pages' schema if the domain is different.
