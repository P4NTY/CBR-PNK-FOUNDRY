const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheet } = foundry.applications.sheets

export default class Item extends HandlebarsApplicationMixin(ItemSheet) {
  get document() { return this.options.document }
  get title() { return `${this.document.name}` }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.item = this.item;
    context.system = this.item.system;
    
    return context
  }

  static async onSubmitForm(event, form, formData) {
    event.preventDefault()
    await this.document.update(formData.object)
  }
}