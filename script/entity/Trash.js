/**
 * @file script/entity/Trash.js
 * Classe représentant un déchet dans l'inventaire d'un joueur.
 */
class Trash {
  /**
   * @param {object} data - Objet déchet brut (depuis Trashs[] du profil utilisateur)
   */
  constructor(data) {
    /** @type {string} Nom */
    this.name = data.Name;

    /** @type {string} URL de l'image */
    this.image = data.Image;

    /** @type {string} Description */
    this.description = data.Description;

    /** @type {number} Chance de loot */
    this.lootChance = data.LootChance;

    /** @type {number} Valeur de vente */
    this.sellValue = data.SellValue;

    /** @type {number} Prix d'achat (-1 = non achetable) */
    this.buyValue = data.BuyValue;

    /** @type {boolean} Disponible en jeu */
    this.enabled = data.Enabled;

    /** @type {number} Quantité possédée */
    this.count = data.Count ?? 1;
  }
}
