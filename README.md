# ChangeLog Hub

Application **Next.js 14 / TypeScript** pour visualiser et partager les changelogs de vos applications stockés dans un dépôt **GitHub** ou **GitLab**.

---

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm run dev
# → http://localhost:3000
```

---

## Docker

```bash
# Production
docker-compose up --build

# Développement avec hot-reload
docker-compose --profile dev up dev
```

---

## Format des fichiers changelog

Placez des fichiers dont le nom contient **`changelog`** avec l'extension `.yml`, `.yaml` ou `.json` dans votre dépôt.

```yaml
# mon-app-changelog.yml
name: Mon Application
description: Description optionnelle
repository: https://github.com/user/repo   # optionnel

versions:
  - version: "2.1.0"
    date: "2024-03-15"
    changes:
      - type: added       # added | changed | fixed | deprecated | removed | security | breaking
        description: Nouvelle fonctionnalité X
      - type: fixed
        description: Correction du bug Y

upcoming:                 # optionnel
  - title: Feature Z
    description: Prévue pour la prochaine version
    priority: high        # high | medium | low
    milestone: v2.2.0
```

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                     # Configuration (3 étapes)
│   ├── page.module.css
│   ├── layout.tsx
│   ├── globals.css
│   ├── apps/
│   │   ├── page.tsx                 # /apps  — liste des applications
│   │   ├── apps.module.css
│   │   └── [slug]/
│   │       ├── page.tsx             # /apps/[slug] — changelog d'une app
│   │       └── app.module.css
│   └── api/
│       ├── validate/route.ts        # POST — vérifie la connexion au dépôt
│       └── changelogs/route.ts      # POST — récupère tous les changelogs
├── lib/
│   ├── config.ts                    # localStorage
│   ├── github.ts                    # API GitHub
│   ├── gitlab.ts                    # API GitLab
│   └── parser.ts                    # Parser YAML / JSON
└── types/index.ts
```

---

## Tokens d'accès

| Plateforme | Où créer | Scope requis |
|-----------|----------|-------------|
| GitHub | Settings → Developer settings → Personal access tokens | `repo` |
| GitLab | User Settings → Access Tokens | `read_repository` |

> Les dépôts **publics** ne nécessitent pas de token.
