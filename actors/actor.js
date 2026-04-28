const { HandlebarsApplicationMixin } = foundry.applications.api
const { ActorSheet } = foundry.applications.sheets

export default class Actor extends HandlebarsApplicationMixin(ActorSheet) {
  get document() { return this.options.document }
  get title() { return `${this.document.name}` }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.actor = this.actor;
    context.system = this.actor.system;
    
    return context
  }

  static async onSubmitForm(event, form, formData) {
    event.preventDefault()
    await this.document.update(formData.object)
  }

  static getTemplateData (action, approach, actor) {
    return ({
      img: actor.img,
      name: actor.name,
      title: "",
      class: "",
      dices: "",
      desc: "",
      action: action,
      approach: approach
    })
  }

  static dicesToIcon (diceArray, isGLICHED) {
    const sides = ['one','two', 'three', 'four', 'five', 'six'];
    return diceArray.map( (dice, index) => `<i class="fa-solid fa-dice-${sides[dice-1]} ${index < isGLICHED ? 'gliched' : ''}"></i>` )
  }

  static async rollPop (templateData, letsRoll) {
    const content = await foundry.applications.handlebars.renderTemplate('systems/CBRPNK/parts/roll-card.hbs', templateData);
    
    ChatMessage.create({
      rolls: [letsRoll],
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({token: this.actor}),
      content: content
    });
  }

  static async roll (dices) {
    const letsRoll = await new Roll( (dices  == 0 ? 2 : dices) +"d6").roll({});
    if (dices === 0)
    // dis Roll
      return [
        letsRoll,
        [Math.min( ...letsRoll.terms[0].results.map( ({result}) => result) )]
      ];
    else
    // normal Roll
      return [
        letsRoll,
        letsRoll.terms[0].results.map( ({result}) => result)
      ];
  }

  static async itemAdd (data, actor) {
    Item.create(data, { parent: actor })
  }
  static async itemDel (id, actor) {
    actor.deleteEmbeddedDocuments("Item", [id])
  }
}