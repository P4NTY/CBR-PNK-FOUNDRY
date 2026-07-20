import Item from "../../../items/item.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Resource extends HandlebarsApplicationMixin(Item) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['resource'],
    tag: 'form',
    form: {
      handler: this.onSubmitForm,
      closeOnSubmit: false,
      submitOnChange: true
    },
    window: { resizable: true }
  }
  /** @inheritDoc */
  static PARTS = {
    form: { template: "systems/CBRPNK/actors/crew/Resource/res.hbs" },
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    return context;
  }
}