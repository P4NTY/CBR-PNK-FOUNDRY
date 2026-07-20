import Actor from "../actor.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Inquisitor extends HandlebarsApplicationMixin(Actor) {
/** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['inquisitor-actor'],
    tag: 'form',
    form: {
      handler: this.onSubmitForm,
      closeOnSubmit: false,
      submitOnChange: true
    },
    position: { width: 760, height: 742 },
    window: { resizable: true },
    actions: {
      rollTrick: this.#rollTrick,
      rollSpecial: this.#rollSpecial,
      rollReaload: this.#rollReaload,
      rollSkill: this.#rollSkill,
    }
  }

  /** @inheritDoc */
  static PARTS = {
    form: { template: "systems/CBRPNK/actors/inquisitor/inquisitor.hbs" },
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return context;
  }


  static _rollResultion(rollResult) {
    if (rollResult.filter( dice => dice == 6).length >= 2)
      return ({
        title: game.i18n.localize("ACTION.crit.title"),
        class: "critical",
        desc: game.i18n.localize("ACTION.crit.desc"),
    })
    else if (Math.max(...rollResult) == 6 ) 
      return ({
        title: game.i18n.localize("ACTION.succ.title"),
        class: "good",
        desc: game.i18n.localize("ACTION.succ.desc"),
      })
    else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) 
      return ({
        title: game.i18n.localize("ACTION.part.title"),
        class: "consequence",
        desc: game.i18n.localize("ACTION.part.desc"),
      })
    else 
      return ({
        title: game.i18n.localize("ACTION.fail.title"),
        class: "bad",
        desc: game.i18n.localize("ACTION.fail.desc"),
    })
  }

  static async #rollSkill(event, target) {
    event.preventDefault();
    const dataRoll = {
      dices: this.actor.system[target.getAttribute('data-skill')].curr
    }

    const [letsRoll, rollResult] = await Inquisitor.roll(
      dataRoll.dices
    )

    const templateData = {
        efect: dataRoll.efect,
        threat: dataRoll.threat,
        ...Inquisitor.getTemplateData(
            `${target.innerText}`,
            ``,
            this.actor
        ),
        ...Inquisitor._rollResultion(rollResult)
    }

    templateData.dices = Inquisitor.dicesToIcon(rollResult);
    await Inquisitor.rollPop(templateData, letsRoll);
  }

  static async #rollTrick(event, target) {
    event.preventDefault();
    const dataRoll = {
      dices: 2,
      addDice: this.actor.system.blood.trick,
      costs: target.getAttribute('data-cost')
    }
    const iconTrickAddon = () => {
      let result = '';
      for (let index = 0; index < this.actor.system.blood.trick; index++)
         result += `<i class="fa-solid fa-droplet"></i>`;
      for (let index = 0; index < this.actor.system.insight.trick; index++)
         result += `<i class="fa-solid fa-triangle"></i>`;
      for (let index = 0; index < this.actor.system.bandolier.trick; index++)
         result += `<i class="fa-solid fa-backpack"></i>`;

      if (result.length) return ' - ' + result;
      return '';
    }

    const [letsRoll, rollResult] = await Inquisitor.roll(
      eval([dataRoll.dices, dataRoll.addDice||0].join('+'))
    )

    const templateData = {
        efect: dataRoll.efect,
        threat: dataRoll.threat,
        ...Inquisitor.getTemplateData(
            `${this.actor.system.weapon[dataRoll.costs == 1 ? 'basic' : 'alt']}`,
            `${iconTrickAddon()}`,
            this.actor
        ),
        ...Inquisitor._rollResultion(rollResult)
    }

    templateData.dices = Inquisitor.dicesToIcon(rollResult);
    await Inquisitor.rollPop(templateData, letsRoll);

    this.actor.update({
      "system.stamina.curr": this.actor.system.stamina.curr - dataRoll.costs,
      "system.blood.curr": this.actor.system.blood.curr - this.actor.system.blood.trick,
      "system.blood.trick": 0,
      "system.insight.curr": this.actor.system.insight.curr - this.actor.system.insight.trick,
      "system.insight.trick": 0,
      "system.bandolier.curr": this.actor.system.bandolier.curr - this.actor.system.bandolier.trick,
      "system.bandolier.trick": 0,
    })
  }
  static async #rollSpecial(event, target) {
    event.preventDefault();
    const dataRoll = {
      dices: target.innerText.split('').pop() / target.getAttribute('data-cost'),
      costs: target.getAttribute('data-cost')
    }

    const [letsRoll, rollResult] = await Inquisitor.roll(
      dataRoll.dices
    )
    
    const templateData = {
      efect: dataRoll.efect,
      threat: dataRoll.threat,
      ...Inquisitor.getTemplateData(
          `${this.actor.system.weapon.special}`,
          `${dataRoll.cost == 1 ? 'Parry' : 'Counter'}`,
          this.actor
      ),
      ...Inquisitor._rollResultion(rollResult)
    }

    templateData.dices = Inquisitor.dicesToIcon(rollResult);
    await Inquisitor.rollPop(templateData, letsRoll);

    this.actor.update({
      "system.bullets.curr": this.actor.system.bullets.curr - (dataRoll.costs * dataRoll.dices)
    })
  }
  static async #rollReaload(event, target) {
    event.preventDefault();
    const dataRoll = {
      dices: target.innerText.split().pop(),
      type: target.getAttribute('data-type') == "silver" ? "bandolier" : "blood"
    }

    const [letsRoll, rollResult] = await Inquisitor.roll(
      dataRoll.dices
    )
    
    const templateData = {
      efect: dataRoll.efect,
      threat: dataRoll.threat,
      ...Inquisitor.getTemplateData(
          `${this.actor.system.selectedWeapon.trick}: ${dataRoll.cost == 1 ? 'Parry' : 'Stun'}`,
          this.actor.system.selectedSkill,
          this.actor
      ),
      title: "Przeładowanie",
      class: "",
      desc: `Odzyskano ${Math.max(...rollResult)} esencji`,
    }
    
    templateData.dices = Inquisitor.dicesToIcon(rollResult);
    await Inquisitor.rollPop(templateData, letsRoll);

    this.actor.update({
      "system.bullets.curr": Math.min( 6, this.actor.system.bullets.curr + Math.max(...rollResult)),
      [`system.${dataRoll.type}.curr`]: this.actor.system[dataRoll.type].curr - dataRoll.dices
    })
  }
}