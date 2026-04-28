import Actor from "../actor.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Crew extends HandlebarsApplicationMixin(Actor) {
    static DEFAULT_OPTIONS = {
        classes: ['cbr_crew'],
        tag: 'form',
        form: {
            handler: this.onSubmitForm,
            closeOnSubmit: false,
            submitOnChange: true
        },
        window: { resizable: true },
        actions: {
        }
    }
}