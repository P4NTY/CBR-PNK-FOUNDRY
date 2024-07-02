export default class cbrHunter extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 600,
            height: 700,
        });
    }

    get template() {
        return `systems/CBRPNK/templates/sheets/${this.actor.type}.hbs`;
    }

    getData() {
        const context = super.getData();
        context.system = context.actor.system;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.mousedown( this._HunterOnMouseDown.bind(this) );
    }

    _HunterOnMouseDown(event) {
        const btnClick = 
            (event.which === 1 || event.button === 0) ? "l" :
            (event.which === 2 || event.button === 1) ? "m" :
            (event.which === 3 || event.button === 2) ? "r" : null;

        if (!event.target.closest(".track")) return ;
        if ( event.target.closest(".track").getAttribute("data-name").match("RANK") ) {
            const rank = event.target.closest(".track").getAttribute("data-name");
            if (btnClick == "l")
                this.actor.update({ 
                    [`system.${rank}.stack`]: Math.min(this.actor.system[rank].stack+1, this.actor.system[rank].max)
                });
            else if (btnClick == "r")
                this.actor.update({ 
                    [`system.${rank}.stack`]: Math.max(this.actor.system[rank].stack-1, 0)
                });
        }
        else if (event.target.closest(".track").getAttribute("data-name").match("activation") ) {
            const skill = event.target.closest(".track").getAttribute("data-name");
            if (btnClick == "l")
                this.actor.update({ 
                    [`system.${skill}.value`]: Math.min(this.actor.system[skill].value+1, this.actor.system[skill].max)
                });
            else if (btnClick == "r")
                this.actor.update({ 
                    [`system.${skill}.value`]: Math.max(this.actor.system[skill].value-1, 0)
                });
        }
        else if (event.target.closest(".track").getAttribute("data-name").match("counter") ) {
            const skill = event.target.closest(".track").getAttribute("data-name");
            if (btnClick == "l")
                this.actor.update({ 
                    [`system.${skill}.value`]: Math.min(this.actor.system[skill].value+1, this.actor.system[skill].max)
                });
            else if (btnClick == "r")
                this.actor.update({ 
                    [`system.${skill}.value`]: Math.max(this.actor.system[skill].value-1, 0)
                });
        }
    }
}