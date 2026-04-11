/**
 * @file script/entity/Armor.js
 * Classe représentant une armure dans l'inventaire d'un joueur.
 */
class Armor {
  /**
   * @param {object} data - Objet armure brut (depuis Armors[] du profil utilisateur)
   */
  constructor(data) {
    /** @type {string} Nom */
    this.name = data.Name;

    /** @type {string} URL de l'image */
    this.image = data.Image;

    /** @type {string} Description */
    this.description = data.Description;

    /** @type {number} Points de défense */
    this.defense = data.Defense;

    /** @type {number} Points d'attaque (généralement 0 pour une armure) */
    this.attack = data.Attack;

    /** @type {number} Rareté de l'item */
    this.stuffRarity = data.StuffRarity;

    /** @type {number} Chance de loot */
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
