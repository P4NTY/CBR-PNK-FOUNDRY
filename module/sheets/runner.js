export default class cbrRunner extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          width: 440,
          height: 790,
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

        html.mousedown( this._RunnerOnMouseDown.bind(this) );
        html.find(`#${this.actor._id}_actionRoll`).mousedown( this.actionRoll.bind(this) );
        html.find(`#${this.actor._id}_resistRoll`).mousedown( this.resistRoll.bind(this) );
        html.find(`#${this.actor._id}_breathRoll`).mousedown( this.breathRoll.bind(this) );
    }
    _RunnerOnMouseDown(event) {
        const btnClick = 
            (event.which === 1 || event.button === 0) ? "l" :
            (event.which === 2 || event.button === 1) ? "m" :
            (event.which === 3 || event.button === 2) ? "r" : null;

        switch (event.target.closest("section").classList[0]) {
            case "persona":
                if ( ["DEBT","CRED"].includes(event.target.classList[0]) ){
                    if (btnClick == "l") {
                        this.actor.update({ [`system.angle.${event.target.innerText}.value`]: Math.min(this.actor.system.angle[event.target.innerText].value+1, this.actor.system.angle[event.target.innerText].max) });
                    }
                    else if (btnClick == "r") {
                        this.actor.update({ [`system.angle.${event.target.innerText}.value`]: Math.max(this.actor.system.angle[event.target.innerText].value-1,0) });
                    }
                }
            break;
            case "roll": 
                if ( event.target.nodeName === "LABEL" ) {
                    const selectValue = event.target.innerText;
                    const selectType = event.target.parentElement.className;
                    this.actor.update({ ["system.roll."+selectType]: selectValue });
                }
            break;
            case "stress":
                if (btnClick == "l") {
                    if (this.actor.system.stress.value+1 == 7 && !this.actor.system.stress.isLOAD) this.overLOAD();
                    this.actor.update({ "system.stress.value": Math.min(this.actor.system.stress.value+1, this.actor.system.stress.max) });
                }
                else if (btnClick == "r")
                    this.actor.update({
                        "system.stress.value": Math.max(this.actor.system.stress.value-1,0),
                        "system.stress.isLOAD": false
                    });
            break;
            case "approach":
                const clickedApproachName = `system.approach.${event.target.parentElement.parentElement.querySelector("h3").innerText}`;

                if (event.target.classList[0] === 'box') {
                    const currSkillValue = event.target.parentElement.parentElement.getAttribute("data-value");
                    if (btnClick == "l") {
                        this.actor.update({ [clickedApproachName+".dice"]: Math.min(currSkillValue+1, 2) });
                    }
                    else if (btnClick == "r") {
                        this.actor.update({ [clickedApproachName+".dice"]: Math.max(currSkillValue-1,0) });
                    }
                }
                else if ( event.target.classList[0] === 'dots' ) {
                    this.actor.update({ ["system.approach."+event.target.parentElement.querySelector("h3").innerText+".GLICHED"]: !this.actor.system.approach[event.target.parentElement.querySelector("h3").innerText].GLICHED });
                }
                else if ( event.target.nodeName === "H3" && btnClick == "l" ) 
                    this.actor.update({ "system.roll.approach": event.target.innerText });
                else if ( event.target.nodeName === "H3" && btnClick == "r" ) 
                    this.actor.update({ "system.roll.approach": "" });
                else if ( event.target.nodeName === "H3" && btnClick == "m" ) 
                    this.actor.update({ [`system.approach.${event.target.innerText}.GLICHED`]: !this.actor.system.approach[event.target.innerText].GLICHED });
            break;
            case "skills": 
                const clickedSkillName = `system.skills.${event.target.closest("tr").querySelector("h3").innerText.split(" ")[0]}`;
                if (event.target.classList[0] === 'box') {
                    const currSkillValue = event.target.closest("tr").getAttribute("data-value");
                    if (btnClick == "l") {
                        this.actor.update({ [clickedSkillName+".dice"]: Math.min(currSkillValue+1, 2) });
                    }
                    else if (btnClick == "r") {
                        this.actor.update({ [clickedSkillName+".dice"]: Math.max(currSkillValue-1,0) });
                    }
                }
                else if ( event.target.nodeName === "SPAN" ) {
                    const clickedSkillExp = event.target.innerText.split(" ")[0];
                    this.actor.update({ [clickedSkillName+".EXPERTISES."+clickedSkillExp]: !this.actor.system.skills[event.target.closest("tr").querySelector("h3").innerText.split(" ")[0]].EXPERTISES[clickedSkillExp] });
                }
                else if ( event.target.nodeName === "H3" && btnClick == "l" ) 
                    this.actor.update({ "system.roll.skill": event.target.innerText.split(" ")[0] });
                else if ( event.target.nodeName === "H3" && btnClick == "r" ) 
                    this.actor.update({ "system.roll.skill": "" });
            break;
            case "augmentations": 
                if (  event.target.nodeName === "INPUT" && btnClick == "m" ) 
                    this.actor.update({ 
                        ["system.AUGMENTATIONS."+event.target.getAttribute("name").split(".")[2]+".GLICHED" ]: !this.actor.system.AUGMENTATIONS[event.target.getAttribute("name").split(".")[2]].GLICHED
                    });
                if ( event.target.nodeName === "P" && btnClick == "l" )
                    this.actor.update({ 
                        ["system.AUGMENTATIONS."+event.target.parentElement.querySelector('[name]').getAttribute("name").split(".")[2]+".GLICHED" ]: !this.actor.system.AUGMENTATIONS[event.target.parentElement.querySelector('[name]').getAttribute("name").split(".")[2]].GLICHED
                    });
            break;
            case "gear":
                if ( event.target.nodeName === "BUTTON" ) {
                    const loadArr = ["light", "medium", "heavy"];
                    this.actor.update({ 
                        "system.GEAR.LOAD.selected": loadArr[(loadArr.indexOf(this.actor.system.GEAR.LOAD.selected)+1)%loadArr.length]
                    });
                }
                else if ( event.target.classList[0] === "stack" ) {
                    const selectGear = event.target.getAttribute('data-type');
                    if ( btnClick == "l" ) 
                        this.actor.update({
                            [`system.GEAR.Equpment.${selectGear}.stack`] : Math.min(this.actor.system.GEAR.Equpment[selectGear].stack + 1, this.actor.system.GEAR.Equpment[selectGear].max)
                        });
                    else if ( btnClick == "r" ) 
                        this.actor.update({
                            [`system.GEAR.Equpment.${selectGear}.stack`] : Math.max(this.actor.system.GEAR.Equpment[selectGear].stack - 1, 0)
                        });
                }
            break;
            case "harm":
                if ( event.target.classList[0] === "track" ){
                    const harmStage = event.target.getAttribute("data-type");
                    if ( btnClick == "l" ) 
                        this.actor.update({
                            [`system.HARM.${harmStage}.value`] : Math.min(this.actor.system.HARM[harmStage].value + 1, this.actor.system.HARM[harmStage].max)
                        });
                    else if ( btnClick == "r" ) 
                        this.actor.update({
                            [`system.HARM.${harmStage}.value`] : Math.max(this.actor.system.HARM[harmStage].value - 1, 0)
                        });
                }
            break;
            default: break;
        }
    }

    async actionRoll(){
        const dataRoll = {
            ...this.actor.system.roll,
            GLICHED: Object.values(this.actor.system.AUGMENTATIONS).filter( ({GLICHED}) => GLICHED ).length + this.actor.system.approach[this.actor.system.roll.approach].GLICHED,
            dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice} + ${(this.actor.system.skills[this.actor.system.roll.skill]||{dice: 0}).dice}`
        }, dicePool = Math.min(6, eval(`${dataRoll.dices}${dataRoll.addDice||"+0"}`) );
        let letsRoll, rollResult = 0;
        const templateData = {
            title: "",
            class: "",
            dices: "",
            img: this.actor.img,
            name: this.actor.name,
            desc: "",
            efect: dataRoll.efect,
            threat: dataRoll.threat,
            action: ["CLOSE","RANGED"].includes(dataRoll.skill) ? dataRoll.skill + " COMBAT" : dataRoll.skill,
            approach: dataRoll.approach
        };

        if ( dicePool <= 0 ) {
            // dis Roll
            letsRoll = await new Roll("2d6").roll();
            rollResult = [Math.min( ...letsRoll.terms[0].results.map( ({result}) => result) )];
        }else {
            // normal Roll
            letsRoll =  await new Roll(dicePool+"d6").roll();
            rollResult = letsRoll.terms[0].results.map( ({result}) => result)
        }

        if (rollResult.filter( dice => dice == 6).length >= 2) {
            templateData.title = "Critical";
            templateData.class = "critical";
            templateData.desc = "It goes as well as intended.";
        }
        else if (Math.max(...rollResult) == 6 ) {
            templateData.title = "Success";
            templateData.class = "good";
            templateData.desc = "It goes as well as intended.";
        }
        else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
            templateData.title = "Partial Success";
            templateData.class = "consequence";
            templateData.desc = "<div>Success, but it comes with a <strong>Consequence</strong>.</div>";
        }
        else {
            templateData.title = "Failure";
            templateData.class = "bad";
            templateData.desc = "<div>Things go bad as they fail and also suffer a <strong>Consequence</strong>.</div>";
        }

        if (dataRoll.GLICHED) {
            rollResult.slice(0,dataRoll.GLICHED).forEach( dice => {
                if (dice <= 3) {
                    templateData.desc += `<div class="GLICHED">${dice}: It triggers a further <strong>Level 2 Consequence</strong> that can’t be Resisted.</div>`;
                }
                else if ( dice == 4 || dice == 5 ) {
                    templateData.desc += `<div class="GLICHED">${dice}: The additional <strong>Consequence</strong> can be Resisted normally</div>`;
                }
            })
        }

        rollResult.forEach( (dice,index) => {
            templateData.dices += `<span class="${index < dataRoll.GLICHED ? "GLICHED" : ""}">${dice}</span>`;
        });

        const content = await renderTemplate('systems/CBRPNK/templates/roll-card.hbs', templateData);

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: this.actor}),
            content: content
        });
    }

    async overLOAD() {
        const templateData = {
            title: "",
            class: "overload",
            dices: "",
            img: this.actor.img,
            name: this.actor.name,
            desc: "<p>When you mark your last ⚡, an Approach of your choosing becomes permanently <em>GLITCHED</em> and immediately incurs a complication, such as:</p>" +
            "<ul><li>You are taken out of action.</li><li>You expose the team’s weakness.</li><li>You make the team lose an advantage.</li><li>You damage or overlook something crucial.</li></ul>"+
            "<p>While <strong>OVERLOADED</strong> you can’t perform actions that would require ⚡. <strong>TAKE A BREATHER</strong> to relieve ⚡ and clear this status.</p>",
            action: "",
            approach: "OVERLOAD"
        };
        const content = await renderTemplate('systems/CBRPNK/templates/roll-card.hbs', templateData);

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: this.actor}),
            content: content
        });

        this.actor.update({ "system.stress.isLOAD": true });
    }

    async resistRoll() {
        const dataRoll = {
            ...this.actor.system.roll,
            dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice}`
        }, dicePool = Math.min(6, eval(`${dataRoll.dices}${dataRoll.addDice||"+0"}`) );
        let letsRoll, rollResult = 0, stress = this.actor.system.stress.value;
        const templateData = {
            title: "",
            class: "",
            dices: "",
            img: this.actor.img,
            name: this.actor.name,
            desc: "",
            action: "RESIST",
            approach: dataRoll.approach
        };

        if ( dicePool <= 0 ) {
            // dis Roll
            letsRoll = await new Roll("2d6").roll();
            rollResult = [Math.min( ...letsRoll.terms[0].results.map( ({result}) => result) )];
        }else {
            // normal Roll
            letsRoll =  await new Roll(dicePool+"d6").roll();
            rollResult = letsRoll.terms[0].results.map( ({result}) => result)
        }

        if (rollResult.filter( dice => dice == 6).length == 2) {
            templateData.title = "2EZ";
            templateData.class = "critical";
            templateData.desc = "THAT’S IT.";
        }
        else if (Math.max(...rollResult) == 6 ) {
            stress += 1;
            templateData.title = "SOLID";
            templateData.class = "good";
            templateData.desc = "MARK ⚡";
            this.actor.update({ "system.stress.value": Math.min( this.actor.system.stress.value + 1, 7) });
        }
        else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
            stress += 2;
            templateData.title = "NOT BAD";
            templateData.class = "consequence";
            templateData.desc = "MARK ⚡⚡";
            this.actor.update({ "system.stress.value": Math.min( this.actor.system.stress.value + 2, 7) });
        }
        else {
            stress += 3;
            templateData.title = "CLOSE";
            templateData.class = "bad";
            templateData.desc = "MARK ⚡⚡⚡";
            this.actor.update({ "system.stress.value": Math.min( this.actor.system.stress.value + 3, 7) });
        }

        rollResult.forEach( (dice) => {
            templateData.dices += `<span>${dice}</span>`;
        });

        const content = await renderTemplate('systems/CBRPNK/templates/roll-card.hbs', templateData);

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: this.actor}),
            content: content
        });
        
        if ( stress >= 7 && !this.actor.system.stress.isLOAD) this.overLOAD();
    }
    async breathRoll() {
        const dataRoll = {
            ...this.actor.system.roll,
            dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice}`
        }, dicePool = Math.min(6, eval(`${dataRoll.dices}${dataRoll.addDice||"+0"}`) );
        let letsRoll, rollResult = 0;
        const templateData = {
            title: "",
            class: "",
            dices: "",
            img: this.actor.img,
            name: this.actor.name,
            desc: "",
            action: "TAKE A BREATH",
            approach: dataRoll.approach
        };

        if ( dicePool <= 0 ) {
            // dis Roll
            letsRoll = await new Roll("2d6").roll();
            rollResult = [Math.min( ...letsRoll.terms[0].results.map( ({result}) => result) )];
        }else {
            // normal Roll
            letsRoll =  await new Roll(dicePool+"d6").roll();
            rollResult = letsRoll.terms[0].results.map( ({result}) => result)
        }

        if (rollResult.filter( dice => dice == 6).length == 2) {
            templateData.title = "YOU’VE BEEN THROUGH WORSE.";
            templateData.class = "critical";
            templateData.desc = "<strong>CLEAR ALL ⚡</strong> -OR- <strong>IGNORE BOTH</strong> LEVELS 1 AND 2 HARM PENALTIES FOR THE REMAINDER OF THE RUN.";
        }
        else if (Math.max(...rollResult) == 6 ) {
            templateData.title = "THAT SHOULD WORK.";
            templateData.class = "good";
            templateData.desc = "<strong>CLEAR ⚡⚡⚡</strong> -OR- <strong>IGONORE</strong> LEVEL 1 OR 2 HARM PENALTIES FOR THE REMAINDER OF THE RUN.";
        }
        else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
            templateData.title = "SUCK IT UP.";
            templateData.class = "consequence";
            templateData.desc = "<strong>CLEAR ⚡⚡</strong> -OR- <strong>IGONORE</strong> LLEVEL 1 HARM PENALTIES FOR THE REMAINDER OF THE RUN.";
        }
        else {
            templateData.title = "TAKE WHAT YOU CAN GET.";
            templateData.class = "bad";
            templateData.desc = "CLEAR ⚡";
            this.actor.update({ 
                "system.stress.value": Math.max( this.actor.system.stress.value - 1, 0),
                "system.stress.isLOAD": false
            });
        }

        rollResult.forEach( (dice,index) => {
            templateData.dices += `<span>${dice}</span>`;
        });

        const content = await renderTemplate('systems/CBRPNK/templates/roll-card.hbs', templateData);

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: this.actor}),
            content: content
        });
        
    }
}