# Planning de permanence hebdomadaire Beterbat

Application web simple et professionnelle pour preparer un planning de permanence aux couleurs de Beterbat, sur une semaine ou sur plusieurs mois.

## Fonctionnalites

- saisie de la liste des personnes de permanence
- choix de la date du lundi de la semaine cible
- generation automatique d'une rotation sur les jours ouvres
- planification sur plusieurs semaines avec un horizon configurable
- gestion de deux creneaux par jour : matin 08:00-13:00 et apres-midi 14:00-17:00
- rotation hebdomadaire du commercial de repos quand l'equipe depasse 5 personnes
- ajustement manuel de chaque affectation
- compteur de semaine ISO avec plage de dates visible
- recapitulatif du nombre de creneaux par personne
- recapitulatif des semaines de repos par personne
- sauvegarde locale automatique dans le navigateur
- export du planning au format CSV
- impression du planning avec mise en page dediee
- interface revue avec branding Beterbat

## Utilisation

Ouvrez `index.html` dans un navigateur moderne.

Vous pouvez aussi lancer un serveur statique local si vous preferez :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

## Design

- couleurs inspirees de Beterbat : rouge `#ce2642`, gris `#6b6b6a`, noir `#272727`
- en-tete avec logo, compteur de semaine et presentation plus corporate
- tableau optimise pour un usage quotidien et pour l'impression
- cartes de rotation hebdomadaire pour visualiser rapidement le commercial absent

## Hypotheses

- une seule personne est assignee par creneau
- le planning couvre du lundi au vendredi
- avec 6 commerciaux, un commercial de repos est defini chaque semaine et tourne dans l'ordre de la liste
- l'index de depart correspond au premier commercial de repos sur la premiere semaine
- la rotation des creneaux se decale chaque semaine pour mieux repartir les horaires

## Structure

- `index.html` : interface
- `styles.css` : styles
- `src/app.js` : logique de generation multi-semaines, edition et export
