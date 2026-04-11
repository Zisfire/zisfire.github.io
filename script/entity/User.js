/**
 * @file script/entity/User.js
 * Classe représentant un utilisateur Bastocos.
 * Source : UsersData/<name>.json
 */
class User {
  /**
   * @param {object} data - JSON brut du fichier UsersData/<name>.json
   */
  constructor(data) {
    /** @type {number} Identifiant Twitch */
    this.id = data.User.Id;

    /** @type {string} Pseudo */
    this.name = data.User.Name;

    /** @type {string} URL de l'avatar */
    this.avatar = data.User.Avatar;

    /** @type {object} Statistiques de jeu (VictoryCount, TotalDamage, etc.) */
    this.stats = data.User.StatisticsItem;

    /** @type {object} Données de connexion (FirstLogin, LastLogin) */
    this.login = data.User.LoginStatsItem;

    /** @type {object[]} Cartes possédées (avec propriété Count) */
    this.cards = data.Cards ?? [];

    /** @type {object[]} Déchets possédés (avec propriété Count) */
    this.trashs = data.Trashs ?? [];

    /** @type {object[]} Armures possédées (avec propriété Count) */
    this.armors = data.Armors ?? [];

    /** @type {object[]} Armes possédées (avec propriété Count) */
    this.weapons = data.Weapons ?? [];

    console.log(`[entity/User] Construit : "${this.name}" (ID: ${this.id})`);
  }
}
