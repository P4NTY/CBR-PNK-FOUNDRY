import Actor from "../actor.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Hunter extends HandlebarsApplicationMixin(Actor) {
    static DEFAULT_OPTIONS = {
        classes: ['cbr_hunter'],
        tag: 'form',
        form: {
            handler: this.onSubmitForm,
            closeOnSubmit: false,
            submitOnChange: true
        },
        window: { resizable: true },
        actions: {
            toggleTracker:{
                handler: this.#toggleTracker,
                buttons: [0, 2]
            },
        }
    }

    /** @inheritDoc */
    static PARTS = {
        form: { template: "systems/CBRPNK/actors/hunter/hunter.hbs" },
    }

    async _prepareContext(options) {
    const context = await super._prepareContext(options);

    return context;
  }

  static async #toggleTracker (event, target) {
    const tracker = target.getAttribute("data-name");
    const mod = event.button ? -1 : 1;
    if ( !tracker ) return;

    this.actor.update({
        [`system.${tracker}.value`]: Math.min(
            this.actor.system[tracker].max,
            Math.max( 0, this.actor.system[tracker].value + mod)
        )
    })
  }
}