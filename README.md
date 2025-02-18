# Actunime RPC

Actunime RPC est une application [Electron](http://electronjs.org) qui permet de personnaliser votre statut Discord grâce à une interface simple et intuitive.
Elle intègre également une fonctionnalité de détection de live sur Twitch pour mettre à jours automatiquement votre statut lors de vos diffusions.

## Table des matières

- [Caractéristiques](#caractéristiques)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Configuration](#configuration)
- [Build et Distribution](#build-et-distribution)
- [Démarrage au login](#démarrage-au-login)
- [Contribution](#contribution)
- [License](#license)

## Caractéristiques

- **Personnalisation complète du statut discord**

Modifiez en temps réel vos descriptions, images et boutons pour votre présence discord.

- **Interface conviviale et intuitive**

Paramétrez facilement l'application via une interface graphique moderne et intuitive.

- **Multi plateforme**

Fonctionne sur Windows et macOS. (Build par défaut génère un DMG pour macOS, et le build Windows nécessite le cross-compiling via Wine ou une VM/CI Windows.)

- **Démarrage au login**

Activez ou désactivez le lancement de l'application au démarrage de votre système.

## Installation

**Prérequis**

- [Node.js](https://nodejs.org) (version 14 ou supérieur (testé via 22.13))
- [npm](https://npmjs.com) (généralement inclus avec Node)

**Installation des dépendances**

Clonez le dépôt et installez les dépendances:

```
git clone https://github.com/Actunime/Actunime-RPC.git
cd Actunime-RPC
npm install
```

## Utilisation

**Développement**

Pour lancer l'application en mode développement:
```
npm run start
```

Cela ouvrira votre application Electron. Les fichiers TypeScript seront compilés dans le dossier `build`.

**Watch mode**

Pour surveiller vos modifications et compiler automatiquement:

```
npm run watch
```

## Configuration

L'interface de configuration vous permet de personnaliser:

- Votre **Client ID** (obtenu via le [Discord Developer Portal](https://discord.com/developers/docs/intro)).
- Les descriptions et images de votre statut.
- Les boutons d'action dans votre statut.
- La configuration de la diffusion Twitch (nom de chaîne, mode streamer, etc.)

Ces paramètres sont enregistrés dans une base de données locale (`db.json`).

## Build et Distribution

**Build de l'application**

Pour compiler le projet:

```
npm run build
```

**Génération des installeurs**

- **macOS**

Sur macOS, par défaut, l'installeur généré sera un fichier `DMG`.

Lancez:

```
npm run build-installer
```

Cela devrait généré le `.dmg` ainsi que le `.exe`.

## Démarrage au login

L'application permet d'activer ou de désactiver le démarrage automatique avec votre système :

- Une option dans l'interface (via `set-auto-start`) vous permet de choisir si l'application doit se lancer au démarrage.
- Le paramétrage est géré via app.setLoginItemSettings()` pour Windows et macOS.

## Contribution

Les contributions sont les bienvenues!

Pour contribuer:

1. Fork ce dépôt
2. Créez une branche pour votre fonctionnalité ou correction (`git checkout -b feature/ma-fonctionnalité`).
3. Commit vos modifications (`git commit -am 'Ajout de ma fonctionnalité'`).
4. Push votre branche (`git push origin feature/ma-fonctionnalité`).
5. Ouvrez une [PR](https://github.com/Actunime/Actunime-RPC/pulls)

## License

Ce projet est sous licence [CC0-1.0](https://github.com/Actunime/Actunime-RPC?tab=CC0-1.0-2-ov-file).
Vous êtes libre de l'utiliser, le modifier et le distribuer sans restriction.


## Support

Pour toute question, problème ou suggestion, veuillez rejoindre le serveur Discord du support:

Support [Actunime](https://discord.gg/pjFXwKKgEu)