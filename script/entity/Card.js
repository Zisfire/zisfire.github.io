/**
 * @file script/entity/Card.js
 * Classe représentant une carte dans l'inventaire d'un joueur.
 */
class Card {
  /**
   * @param {object} data - Objet carte brut (depuis Cards[] du profil utilisateur)
   */
  constructor(data) {
    /** @type {string} Nom de la carte */
    this.name = data.Name;

    /** @type {string} URL de l'image */
    this.image = data.Image;

    /** @type {string} Description */
    this.description = data.Description;

    /** @type {string|null} Rareté */
    this.rarity = data.CardRarity ?? 'Standard';

    /** @type {number} Chance de loot (0 dans les données utilisateur) */
    this.lootChance = data.LootChance;

    /** @type {number} Valeur de vente */
    this.sellValue = data.SellValue;

    /** @type {number} Prix d'achat */
    this.buyValue = data.BuyValue;

    /** @type {boolean} Disponible en jeu */
    this.enabled = data.Enabled;

    /** @type {number} Quantité possédée */
    this.count = data.Count ?? 1;
  }
}
