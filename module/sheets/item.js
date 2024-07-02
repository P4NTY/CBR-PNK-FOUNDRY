// import tags from "../../tags.js";
export default class cbrItem extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 600,
            height: 350,
        });
    }

    get template() {
        return `systems/CBRPNK/templates/sheets/${this.item.type}.hbs`;
    }

    getData() {
        const context = super.getData();
        context.system = context.item.system;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(`#${this.item._id}_addStack`).mousedown( this._changeStack.bind(this) );
    }

    _changeStack(event) {
        const btnClick = 
            (event.which === 1 || event.button === 0) ? "l" :
            (event.which === 2 || event.button === 1) ? "m" :
            (event.which === 3 || event.button === 2) ? "r" : null;
        
        switch (btnClick) {
            case "l":
                this.item.update({ "system.maxStack" : this.item.system.maxStack + 1 });
                break;
            case "r":
                this.item.update({ "system.maxStack" : Math.max(this.item.system.maxStack - 1,0) });
                break;
            default:
                break;
        }
    }
}