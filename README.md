# Planning de permanence hebdomadaire

Application web simple pour preparer un planning de permanence sur une semaine ouvrée.

## Fonctionnalites

- saisie de la liste des personnes de permanence
- choix de la date du lundi de la semaine cible
- generation automatique d'une rotation sur les jours ouvres
- ajustement manuel de chaque affectation
- sauvegarde locale automatique dans le navigateur
- export du planning au format CSV

## Utilisation

Ouvrez `index.html` dans un navigateur moderne.

Vous pouvez aussi lancer un serveur statique local si vous preferez :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

## Hypotheses

- une seule personne est assignee par jour
- le planning couvre du lundi au vendredi
- la rotation se fait dans l'ordre de la liste, avec un index de depart configurable

## Structure

- `index.html` : interface
- `styles.css` : styles
- `src/app.js` : logique de generation, edition et export
