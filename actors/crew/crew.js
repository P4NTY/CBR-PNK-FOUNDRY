import Actor from "../actor.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Crew extends HandlebarsApplicationMixin(Actor) {
    static DEFAULT_OPTIONS = {
        classes: ['cbr_crew'],
        tag: 'form',
        position: { width: 770, height: 700 },
        form: {
            handler: this.onSubmitForm,
            closeOnSubmit: false,
            submitOnChange: true
        },
        window: { resizable: true },
        actions: {
            openActor: this.#openActor,
            removeActor: this.#removeActor,
            addResources: this.#addResources,
            openRes: this.#openRes,
            removeItem: this.#removeItem,
            changeClock: {handler: this.#changeClock, buttons: [0, 2]},
        }
    }

    /** @inheritDoc */
    static PARTS = {
        form: { template: "systems/CBRPNK/actors/crew/crew.hbs" },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.squad = this.actor.system.squad.map( uuid => {
            const actor = game.actors.get(uuid);

            return ({
                _id: uuid,
                img: actor.img,
                name: actor.name
            })
        })
        context.system.squadLength = this.actor.system.squad.length;
        context.resources = this.actor.items.filter( ({type}) => type == "resources" );

        return context;
    }

    static async #openActor(event, target) {
        const actor = game.actors.get(target.getAttribute("data-id"));
        if (actor) actor.sheet.render(true);
    }

    static async #removeActor(event, target) {
        this.actor.update({
            "system.squad": this.actor.system.squad.filter( id => 
                id !=  target.closest('.crewMate').getAttribute("data-id")
            )
        })
    }

    static async #addResources(event, target) {
        Item.create({
            name: "Zasób",
            type: "resources",
            system: { 
                "desc": "",
                "short": "",
                "value": 1,
                "max": 8
            }
        }, { parent: this.actor });
    }

    static async #openRes(event, target) {
        const trgt = this.actor.items.get(target.closest('.res').getAttribute("data-id"));
        if (trgt) trgt.sheet.render(true);
    }   

    static async #removeItem(event, target) {
        this.actor.deleteEmbeddedDocuments("Item", [
            target.closest('.res').getAttribute("data-id")
        ]);
    }

    static async #changeClock (event, target) {
        const mod = event.button ? -1 : 1;
        const trgt = this.actor.items.get(target.closest('.res').getAttribute("data-id"));

        trgt.update({
            "system.value": Math.max(1,
                Math.min(
                    trgt.system.max,
                    trgt.system.value + mod
                )
            )
        })
    }
}