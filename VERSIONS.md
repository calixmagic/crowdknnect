# Historique des Versions & Bugs (CrowdConnect)

Ce fichier garde la trace des versions stables et des expérimentations pour faciliter les retours en arrière en cas de pépin (régressions, bugs de synchronisation, etc.).

## 🟢 Versions Stables Actuelles

### `v0.9-stable` (Commit `118684e`) - 12 Février 2026
- **Description** : Version de base très stable ("Admin UX: Quick Add Value & List Stability Fix"). Cette version a été restaurée après des tests infructueux avec des versions ultérieures plus complexes.
- **État** : **STABLE**. C'est le point de restauration principal actuel.

---

## 🔴 Expérimentations & Instabilités Connues

### `v1.0-unstable` (Commits 12 au 14 Février) - Février 2026
- **Description** : Longues séries de commits "Full customization for all steps". 
- **Problème rencontré** : Selon les tests en production, cette personnalisation approfondie a cassé des comportements de l'interface qui fonctionnaient jusqu'alors. Roulée en arrière.

### `v1.1-experimental-logs` (Commits récents abandonnés) - 28 Février 2026
- **Description** : Tentative d'ajouter un "Hyper-logging" console et de patcher les politiques de lecture `NoSleep` et `AudioContext` sur iOS.
- **Problème rencontré** : Bien que les logs fassent très bien remonter l'info (et qu'un correctif de scrolling ait été intégré via cherry-pick), la structure devenait complexe et des conflits Git intempestifs (`>>>>>>>`) sont apparus.

---

## 💡 Procédure de Rollback

Si vous souhaitez revenir à une version spécifique listée ici, exécutez la commande suivante dans le terminal :

```bash
# Pour annuler toutes vos modifications actuelles et revenir au bon vieux temps :
git fetch origin
git reset --hard <ID_DU_COMMIT>
git push origin main -f
```
