// import tags from "../../tags.js";
export default class emItem extends ItemSheet {
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
        
        const input = html[0].querySelector('input.tagify');
        new Tagify(input, {
            whitelist: [
                "Święte",
                "Splugawione"
            ],
            maxTags: 10,
            dropdown: {
                maxItems: 20,
                classname: "tags-look",
                enabled: 0,
                closeOnSelect: false
            }
        })
    
        html.find('.clock').mousedown( this._onMouseDown.bind(this) );
    }

    _onMouseDown(event) {
        event.preventDefault();

        const colorArr = ["white","black","red","blue","yellow","purple","green"];

        // console.log( event.target );
        // leftBtn
        if (event.which === 1 || event.button === 0)
            this.item.update({ "system.value": Math.min(this.item.system.value+1,this.item.system.max) });
        // middleBtn
        else if (event.which === 2 || event.button === 1)
            this.item.update({ "system.color": colorArr[
                (colorArr.indexOf(this.item.system.color)+1)%colorArr.length
            ] });
        // rightBtn
        else if (event.which === 3 || event.button === 2)
            this.item.update({ "system.value": Math.max(this.item.system.value-1,0) });
    }
}