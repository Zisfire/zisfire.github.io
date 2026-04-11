/**
 * @file script/entity/GlobalData.js
 * Classe représentant les compteurs globaux du jeu.
 * Source : globaldata.json
 */
class GlobalData {
  /**
   * @param {object} data - JSON brut de globaldata.json
   */
  constructor(data) {
    /** @type {number} Nombre total de cartes différentes dans le jeu */
    this.cardCount = data.CardCount;

    /** @type {number} Nombre total de déchets différents dans le jeu */
    this.trashCount = data.TrashCount;

    /** @type {number} Nombre total d'armures différentes dans le jeu */
    this.armorCount = data.ArmorCount;

    /** @type {number} Nombre total d'armes différentes dans le jeu */
    this.weaponCount = data.WeaponCount;

    console.log('[entity/GlobalData] Chargé :', this);
  }
}
