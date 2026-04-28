import Item from "../../../items/item.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Dossier extends HandlebarsApplicationMixin(Item) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['dossier'],
    tag: 'form',
    form: {
      handler: this.onSubmitForm,
      closeOnSubmit: false,
      submitOnChange: true
    },
    window: { resizable: true },
    actions: {
      toggleEffect: this.#toggleEffect,
    }
  }

  /** @inheritDoc */
  static PARTS = {
    form: { template: "systems/CBRPNK/actors/runner/dossier/dossier.hbs" },
  }

  mapped = {
    stress: "system.stress.max",
    gear: "system.GEAR.LOAD.max",
    cred: "system.angle.cred.max",
    debt: "system.angle.debt.max",
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    Object.keys(this.mapped).forEach( flag => {
      const effect = this.item.effects.getName(flag);
      if (!effect) {
        ActiveEffect.implementation.create({
            name: flag,
            transfer: true,
            disabled: false,  
            changes: [{
                key: this.mapped[flag],
                value: this.item.system.mods[flag].value||0,
                mode: CONST.ACTIVE_EFFECT_CHANGE_TYPES.ADD  
            }]
        }, { parent: this.item });
        context.system.mods[flag].isActive = true;
      } else
        effect.update({ 
          changes: [{
              key: this.mapped[flag],
              value: this.item.system.mods[flag].value||0,
              mode: CONST.ACTIVE_EFFECT_CHANGE_TYPES.ADD  
          }]
        });
    })
    
    return context;
  }

  static async #toggleEffect (event, target) {
    const flag = target.closest("[data-flag]").getAttribute("data-flag"),
          effect = this.item.effects.getName(flag);
    if (!effect) return ;

    effect.update({ disabled: !effect.disabled });
      this.item.update({
        [`system.mods.${flag}.isActive`]: !this.item.system.mods[flag].isActive
      })
  }
}