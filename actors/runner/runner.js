import Actor from "../actor.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class Runner extends HandlebarsApplicationMixin(Actor) {
/** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['runner'],
    tag: 'form',
    form: {
      handler: this.onSubmitForm,
      closeOnSubmit: false,
      submitOnChange: true
    },
    position: { width: 460, height: 700 },
    window: { resizable: true },
    actions: {
        //rolls
        rollAction: this.#rollAction,
        rollResist: this.#rollResist,
        rollBreath: this.#rollBreath,
        rollAngle: this.#rollAngle,
        //items
        itemAddAug: this.#itemAddAug,
        itemDelAug: this.#itemDelAug,
        itemAddHarm: this.#itemAddHarm,
        itemToggle: this.#itemToggle,
        itemName: this.#itemName,
        //set 
        setDice: {handler: this.#setDice, buttons: [0, 2]},
        stressChange: {handler: this.#stressChange, buttons: [0, 2]},
        gearLoadChange: {handler: this.#gearLoadChange, buttons: [0, 2]},
        gearSelect: this.#gearSelect,
        gearChangeStack: {handler: this.#gearChangeStack, buttons: [0, 2]},
        setExpertise:{handler: this.#setExpertise, buttons: [0, 2]},
        fateChange:{handler: this.#fateChange, buttons: [0, 2]},
        glichToggle: this.#glichToggle,
        // dialogs
        openNotes: this.#openNotes
    }
  }

  /** @inheritDoc */
  static PARTS = {
    form: { template: "systems/CBRPNK/actors/runner/runner.hbs" },
  }

  async baseGear() {
    const json = `systems/CBRPNK/actors/runner/gear.json`;
    return fetch(json).then( r => r.json() );
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.augs = this.actor.items.filter( ({type}) => type === "augmentation");
    context.gears = this.actor.items.filter( ({type}) => type === "gear");
    context.approaches = Object.keys(this.actor.system.approach).map( x => ({
        id: x,
        name: game.i18n.localize(`Approach.${x}.name`),
        isGLICHED: this.actor.system.approach[x].GLICHED,
        flaw: game.i18n.localize(`Approach.${x}.flaw`),
        desc: game.i18n.localize(`Approach.${x}.desc`),
        dice: this.actor.system.approach[x].dice,
        isActive: this.actor.system.roll.approach === x
    }));
    context.skills = Object.keys(this.actor.system.skills)
           .filter( x=> 
                x !== "ATTUNE" 
                ||
                (x == "ATTUNE" && this.actor.items.getName(`Dossier`)?.system.isWierd) )
            .map( x => ({
        id: x,
        name: game.i18n.localize(`Skill.${x}.name`),
        dice: this.actor.system.skills[x].dice,
        expertises: Object.keys(this.actor.system.skills[x].EXPERTISES).map( e => ({
            id: e,
            e_name: game.i18n.localize(`Skill.${x}.${e}`),
            e_isActive: this.actor.system.skills[x].EXPERTISES[e]
        })),
        isActive: this.actor.system.roll.skill === x
    }))
    if (!this.actor.items.filter( ({type}) => type === "gear").length) {
        this.baseGear().then( gears =>{
            gears.forEach( ({name, value, max}) => {
                Item.create({
                    "type": "gear",
                    "name": game.i18n.localize(`GEAR.${name}.name`),
                    system: {
                        "isUse": false,
                        "value": value,
                        "desc": game.i18n.localize(`GEAR.${name}.desc`).replace(`GEAR.${name}.desc`,''),
                        "stack": 0,
                        "max": max||0
                    }
                }, { parent: this.actor });
            });
        })
    }
    return context
  }

  static async #rollAction(event, target) {
    event.preventDefault();
    const dataRoll = {
        ...this.actor.system.roll,
        dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice} + ${(this.actor.system.skills[this.actor.system.roll.skill]||{dice: 0}).dice}`,
        GLICHED: this.actor.items.map( ({system}) => 
                system.isGLICHED && ( !this.actor.system.AugGlitchedCheck || system.isActive )
            ).filter(x => x).length + 
            this.actor.system.approach[this.actor.system.roll.approach].GLICHED + 
            this.actor.system.roll.isGlichDice,
    }
    const templateData = {
        efect: dataRoll.efect,
        threat: dataRoll.threat,
        ...Runner.getTemplateData(
            game.i18n.localize(`Skill.${dataRoll.skill}.name`),
            game.i18n.localize(`Approach.${dataRoll.approach}.name`),
            this.actor
        )
    }
    const [letsRoll, rollResult] = await Runner.roll(
        Math.min(6, eval([dataRoll.dices, dataRoll.addDice||0, (this.actor.system.roll.isGlichDice ? 1 : 0)].join('+')) )
    )

    if (rollResult.filter( dice => dice == 6).length >= 2) {
        templateData.title = game.i18n.localize("ACTION.crit.title");
        templateData.class = "critical";
        templateData.desc = game.i18n.localize("ACTION.crit.desc");
    }
    else if (Math.max(...rollResult) == 6 ) {
        templateData.title = game.i18n.localize("ACTION.succ.title");
        templateData.class = "good";
        templateData.desc = game.i18n.localize("ACTION.succ.desc");
    }
    else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
        templateData.title = game.i18n.localize("ACTION.part.title");
        templateData.class = "consequence";
        templateData.desc = game.i18n.localize("ACTION.part.desc");
    }
    else {
        templateData.title = game.i18n.localize("ACTION.fail.title");
        templateData.class = "bad";
        templateData.desc = game.i18n.localize("ACTION.fail.desc");
    }

    if (dataRoll.GLICHED) {
        rollResult.slice(0,dataRoll.GLICHED).forEach( dice => {
            if (dice <= 3) {
                templateData.desc += `<div class="GLICHED">${dice}: ${game.i18n.localize("ACTION.GLICHED.hard")}</div>`;
            }
            else if ( dice == 4 || dice == 5 ) {
                templateData.desc += `<div class="GLICHED">${dice}: ${game.i18n.localize("ACTION.GLICHED.normal")}</div>`;
            }
        })
    }

    templateData.dices = Runner.dicesToIcon(rollResult, dataRoll.GLICHED);
    await Runner.rollPop(templateData, letsRoll);
  }

  static async #rollAngle (event, target) {
    event.preventDefault();
    const dataRoll = {
        ...this.actor.system.roll,
        dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice} + ${this.actor.system.angle.CRED.value - this.actor.system.angle.DEBT.value}`,
    }
    let stress = this.actor.system.stress.value;
    const templateData = Runner.getTemplateData(
        game.i18n.localize("ROLL.AngelRoll"),
        game.i18n.localize(`Approach.${dataRoll.approach}.name`),
        this.actor
    )
    const [letsRoll, rollResult] = await Runner.roll(
        Math.min(6, eval([dataRoll.dices, dataRoll.addDice||0].join('+')) )
    )

    if (rollResult.filter( dice => dice == 6).length >= 2) {
        templateData.title = game.i18n.localize("ANGEL.crit.title");
        templateData.class = "critical";
        templateData.desc = game.i18n.localize("ANGEL.crit.desc");
    }
    else if (Math.max(...rollResult) == 6 ) {
        templateData.title = game.i18n.localize("ANGEL.succ.title");
        templateData.class = "good";
        templateData.desc = game.i18n.localize("ANGEL.succ.desc");
    }
    else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
        templateData.title = game.i18n.localize("ANGEL.part.title");
        templateData.class = "consequence";
        templateData.desc = game.i18n.localize("ANGEL.part.desc");
    }
    else {
        templateData.title = game.i18n.localize("ANGEL.fail.title");
        templateData.class = "bad";
        templateData.desc = game.i18n.localize("ANGEL.fail.desc");
    }

    templateData.dices = Runner.dicesToIcon(rollResult);
    await Runner.rollPop(templateData, letsRoll);
  }

  static async #rollResist(event, target) {
    event.preventDefault();
    const dataRoll = {
        ...this.actor.system.roll,
        dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice}`,
    }
    let stress = this.actor.system.stress.value;
    const templateData = Runner.getTemplateData(
        game.i18n.localize("ROLL.ResistRoll"),
        game.i18n.localize(`Approach.${dataRoll.approach}.name`),
        this.actor
    )
    const [letsRoll, rollResult] = await Runner.roll(
        Math.min(6, eval([dataRoll.dices, dataRoll.addDice||0].join('+')) )
    )

    if (rollResult.filter( dice => dice == 6).length >= 2) {
        templateData.title = game.i18n.localize("RESIST.crit.title");
        templateData.class = "critical";
        templateData.desc = game.i18n.localize("RESIST.crit.desc");
    }
    else if (Math.max(...rollResult) == 6 ) {
        stress += 1;
        templateData.title = game.i18n.localize("RESIST.succ.title");
        templateData.class = "good";
        templateData.desc = game.i18n.localize("RESIST.succ.desc");
    }
    else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
        stress += 2;
        templateData.title = game.i18n.localize("RESIST.part.title");
        templateData.class = "consequence";
        templateData.desc = game.i18n.localize("RESIST.part.desc");
    }
    else {
        stress += 3;
        templateData.title = game.i18n.localize("RESIST.fail.title");
        templateData.class = "bad";
        templateData.desc = game.i18n.localize("RESIST.fail.desc");
    }

    templateData.dices = Runner.dicesToIcon(rollResult);
    await Runner.rollPop(templateData, letsRoll);
    
    this.actor.update({ "system.stress.value": Math.min( stress, 7) });
    if ( stress >= 7 && !this.actor.system.stress.isLOAD) Runner.overLOAD(this.actor);
  }
  static async #rollBreath(event, target) {
    event.preventDefault();
    const dataRoll = {
        ...this.actor.system.roll,
        dices: `${this.actor.system.approach[this.actor.system.roll.approach].dice}`,
    }
    let stress = this.actor.system.stress.value;
    const templateData = Runner.getTemplateData(
        game.i18n.localize("ROLL.BreathRoll"),
        game.i18n.localize(`Approach.${dataRoll.approach}.name`),
        this.actor
    )
    const [letsRoll, rollResult] = await Runner.roll(
        Math.min(6, eval([dataRoll.dices, dataRoll.addDice||0].join('+')) )
    )

    if (rollResult.filter( dice => dice == 6).length >= 2) {
        templateData.title = game.i18n.localize("BREATH.crit.title");
        templateData.class = "critical";
        templateData.desc = game.i18n.localize("BREATH.crit.desc");
    }
    else if (Math.max(...rollResult) == 6 ) {
        templateData.title = game.i18n.localize("BREATH.succ.title");
        templateData.class = "good";
        templateData.desc = game.i18n.localize("BREATH.succ.desc");
    }
    else if (rollResult.filter( dice => dice == 4 || dice == 5).length ) {
        templateData.title = game.i18n.localize("BREATH.part.title");
        templateData.class = "consequence";
        templateData.desc = game.i18n.localize("BREATH.part.desc");
    }
    else {
        templateData.title = game.i18n.localize("BREATH.fail.title");
        templateData.class = "bad";
        templateData.desc = game.i18n.localize("BREATH.fail.desc");
        this.actor.update({ 
            "system.stress.value": Math.max(this.actor.system.stress.value - 1, 0),
            "system.stress.isLOAD": false
        });
    }

    templateData.dices = Runner.dicesToIcon(rollResult);
    await Runner.rollPop(templateData, letsRoll);
  }
  static async #itemAddAug(event, target) {
    Runner.itemAdd({
        name: "Aug",
        type: "augmentation"
    }, this.actor)
  }
  static async #itemDelAug(event, target) {
    Runner.itemDel(
        event.target.closest("[data-item-id]").getAttribute("data-item-id"),
        this.actor
    )
  }
  static async #setDice(event, target) {
    const mod = event.button ? -1 : 1;
    const trgt = [
        target.closest("[data-app]")?.getAttribute("data-app"),
        target.getAttribute("data-skill")
    ];
    
    if (trgt[0]) this.actor.update({
        [`system.approach.${trgt[0]}.dice`]: 
            Math.max(0, Math.min(this.actor.system.approach[trgt[0]].dice + mod, 2))
    })
    else if (trgt[1]) this.actor.update({
        [`system.skills.${trgt[1]}.dice`]:
            Math.max(0, Math.min(this.actor.system.skills[trgt[1]].dice + mod, 2))
    })
  }

  static async overLOAD(actor) {
    const templateData = {
        class: "alert",
        img: actor.img,
        name: actor.name,
        desc: game.i18n.localize("RUNNER.OVERLOAD.desc"),
        approach: game.i18n.localize("RUNNER.OVERLOAD.name")
    };
    const content = await foundry.applications.handlebars.renderTemplate(
        'systems/CBRPNK/parts/roll-card.hbs',
        templateData
    );

    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: content
    });

    actor.update({ "system.stress.isLOAD": true });
  }
  static async #stressChange (event, target){
    const mod = event.button ? -1 : 1;
    this.actor.update({
        "system.stress.value": Math.max(
            0,
            Math.min(
                this.actor.system.stress.value + mod,
                this.actor.system.stress.max
            )
        )
    })

    if (
        !this.actor.system.stress.isLOAD 
        && this.actor.system.stress.value + mod === this.actor.system.stress.max
    ) Runner.overLOAD(this.actor);
    else if (
        this.actor.system.stress.isLOAD 
        && this.actor.system.stress.value + mod < this.actor.system.stress.max
    ) this.actor.update({ "system.stress.isLOAD": false });
  }
  static async #gearLoadChange (event, target) {
    const selectLoad = [
        { "value": this.actor.system.GEAR.LOAD.value, "selected": 0, "max": 3, "desc": game.i18n.localize('LOAD.LIGHT')},
        { "value": this.actor.system.GEAR.LOAD.value, "selected": 1, "max": 5, "desc": game.i18n.localize('LOAD.MEDIUM')},
        { "value": this.actor.system.GEAR.LOAD.value, "selected": 2, "max": 7, "desc": game.i18n.localize('LOAD.HEAVY')},
    ][
        ((parseInt(this.actor.system.GEAR.LOAD.selected)||0) + (event.button ? -1 : 1))%3
    ]

    this.actor.update({"system.GEAR.LOAD": selectLoad});
  }
  static async #gearSelect (event, target) {
    const targetItem  = this.actor.items.get(target.closest("[data-item-id]").getAttribute("data-item-id"));
    const newGearValue = this.actor.system.GEAR.LOAD.value + (targetItem.system.value * (targetItem.system.isUse ? -1 : 1))
    this.actor.update({ "system.GEAR.LOAD.value": newGearValue })
    targetItem.update({ "system.isUse": !targetItem.system.isUse });

    if (newGearValue > this.actor.system.GEAR.LOAD.max) {
        //overGEARED
        const templateData = {
            class: "alert",
            img: this.actor.img,
            name: this.actor.name,
            desc: game.i18n.localize("GEAR.overGEARED.desc"),
            approach: game.i18n.localize("GEAR.overGEARED.name")
        };
        const content = await foundry.applications.handlebars.renderTemplate(
            'systems/CBRPNK/parts/roll-card.hbs',
            templateData
        );

        ChatMessage.create({
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({token: this.actor}),
            content: content
        });
    }
  }
  static async #gearChangeStack (event, target) {
    const targetItem  = this.actor.items.get(target.closest("[data-item-id]").getAttribute("data-item-id"));
    const mod = event.button ? -1 : 1;
    targetItem.update({
        "system.stack": Math.max(
            0,
            Math.min(
                targetItem.system.stack + mod,
                targetItem.system.max
            )
        )
    })
  }
  static async #setExpertise (event, target) {
    const skill = target.closest("[data-skill]").getAttribute("data-skill"), 
          exp = target.getAttribute("data-id");
    this.actor.update({
        [`system.skills.${skill}.EXPERTISES.${exp}`]: 
        !this.actor.system.skills[skill].EXPERTISES[exp]
    })
  }
  static async #itemToggle (event, target) {
    const targetItem  = this.actor.items.get(target.closest("[data-item-id]").getAttribute("data-item-id")),
          flag = target.getAttribute("data-flag");
    targetItem.update({ [`system.${flag}`]: !targetItem.system[flag] })
  }
  static async #itemName (event, target) {
    target.addEventListener('change', ()=>{
        const targetItem  = this.actor.items.get(target.closest("[data-item-id]").getAttribute("data-item-id"));
        targetItem.update({ "name": target.value })
    })
  }

  static async #glichToggle (event, target) {
    const app = target.closest("[data-app]").getAttribute("data-app");
    this.actor.update({
        [`system.approach.${app}.GLICHED`]: !this.actor.system.approach[app].GLICHED
    })
  }

  static async #fateChange (event, target) {
    const flag = target.getAttribute("data-flag"),
          mod = event.button ? -1 : 1;
    
    this.actor.update({
        [`system.angle.${flag}.value`]: Math.max(
            0,
            Math.min(
                this.actor.system.angle[flag].value + mod,
                this.actor.system.angle[flag].max
            )
        )
    })
  }

  static async #itemAddHarm (event, target) {
    Runner.itemAdd({
        name: "Harm",
        type: "harm"
    }, this.actor)
  }
  
  static async #openNotes () {
    if (!this.actor.items.filter( ({type}) => type === "dossier").length)
        Item.create({
            "type": "dossier",
            "name": `Dossier`,
            system: { 
                "desc": this.actor.system.angle.DETAILS||"",
                "wrf": this.actor.system.angle.for||""
            }
        }, { parent: this.actor }).then( e => e.sheet.render(true) );
    else
        this.actor.items.filter( ({type}) => type === "dossier")[0].sheet.render(true);
  }
}