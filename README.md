# 💘 Doxan — Trouve ton crush à Dakar

MVP d'une appli de rencontres décontractées (drague copain/copine) pensée pour le Sénégal.

## Lancer

```bash
node server.js
```

Puis ouvre **http://localhost:3000**

## Ce qui est dans le MVP

- **Swipe** : cartes de profils (drag souris/tactile, ou boutons ✕ / ⭐ / ♥)
- **Match** + modale « C'est un match ! »
- **Chat** avec brise-glace suggérés et réponses auto (démo)
- **Freemium** :
  - Gratuit : 10 likes/jour, chat une fois matché
  - **Doxan Gold** : voir *qui t'a liké*, likes illimités, boost, super crush, incognito
- **Paiement mobile money** simulé : Wave / Orange Money / Free Money (à l'unité ou abonnement)
- **Profil** éditable (prénom, âge, ville, bio, emoji vibe)
- Interface **mobile-first**, vibe Dakar, bilingue FR (touches Wolof)

## Stack

Node.js **pur** (zéro dépendance) — serveur HTTP + API JSON + état en mémoire.
Front vanilla JS/CSS. Idéal comme démo/prototype.

## Prochaines étapes (vers la prod)

1. Base de données réelle (Postgres/Supabase) + auth (OTP par SMS)
2. Vraie intégration Wave / Orange Money (API paiement)
3. Vérification de profil (selfie) anti-faux comptes
4. Modération / signalement, géolocalisation réelle
5. Notifications push, temps réel (WebSocket) pour le chat
