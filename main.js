import cbrRunner from "./actors/runner/runner.js";
import cbrDossier from "./actors/runner/dossier/dossier.js"
import cbrHunter from "./actors/hunter/hunter.js";
import cbrCrew from "./actors/crew/crew.js";
import cbrRes from "./actors/crew/Resource/res.js";
import bsInquisitor from "./actors/inquisitor/inquisitor.js";
import { CbrSettings } from "./world.js";

const runnerParts = 'systems/CBRPNK/actors/runner/parts/'

async function preloadHandlebarTemplates() {
    const templatepaths = [
      `${runnerParts}augmentation.hbs`,
      `${runnerParts}gear.hbs`,
      `${runnerParts}approach.hbs`,
      `${runnerParts}skill.hbs`,
      `systems/CBRPNK/actors/crew/parts/crewMate.hbs`,
    ];
    return foundry.applications.handlebars.loadTemplates(templatepaths);
}

Hooks.once("init", async function () {
    console.log('Start');

    foundry.documents.collections.Items.unregisterSheet("core",ItemSheet);
    foundry.documents.collections.Items.registerSheet("cbr", cbrDossier, {makeDefault: true});
    foundry.documents.collections.Items.registerSheet("cbr", cbrRes, {makeDefault: true});

    foundry.documents.collections.Actors.unregisterSheet("core", ActorSheet);
    foundry.documents.collections.Actors.registerSheet("cbr", cbrRunner, {types: ["runner"], makeDefault: true});
    foundry.documents.collections.Actors.registerSheet("cbr", cbrHunter, {types: ["hunter"], makeDefault: true});
    foundry.documents.collections.Actors.registerSheet("cbr", cbrCrew, {types: ["crew"], makeDefault: true});
    foundry.documents.collections.Actors.registerSheet("cbr", bsInquisitor, {types: ["inquisitor"], makeDefault: true});

    CbrSettings.register();
    await preloadHandlebarTemplates();

    console.log("Successfully initialized CBR+PNK!");
});

Hooks.on("dropActorSheetData", (actor, sheet, data) => {
    console.log({
        actor: actor,
        data: data,
        sheet: sheet
    });

    if ( 
        (actor.type != 'crew' && data.type != "Actor")
        ||
        actor.system.squad.includes(data.uuid)
        ||
        !data.uuid.includes('Actor.')
    ) return ;

    actor.update({
        "system.squad": [...actor.system.squad, data.uuid.replace("Actor.",'')]
    })
});

// Custom HandelBars
Handlebars.registerHelper("for", function(options, elem) {
    let result = ``;
    for (let i = 1 ; i <= options ; i++)
        result += elem.fn(this).replace('#{i}', i);
    return result;
});

Handlebars.registerHelper('isBigger', function (max, value) {
    return value <= max;
});

Handlebars.registerHelper('isEqual', function (max, value) {
    return value == max;
});

Handlebars.registerHelper('isLower', function (min, value) {
    return value > min;
});

Handlebars.registerHelper('drawDice', function (dices) {
    return [1,2].map( box => box <= dices ? `<i class="fa-solid fa-square-plus"></i>` : `<i class="fa-regular fa-square-plus"></i>` ).toLocaleString().replace(',','')
})

Handlebars.registerHelper('drawStress', function (value, max) {
    const result = [];
    for (let index = 1; index < max; index++) {
        result.push(
            (index <= value) ?
                `<i class="fa-solid fa-bolt"></i>`
            :
                `<i class="fa-light fa-bolt"></i>`
        )
    }
    result.push(
        (value === max) ?
            `<i class="fa-solid fa-bolt-slash"></i>`
        :
            `<i class="fa-light fa-bolt-slash"></i>`
    )
    return result.join('')
})

Handlebars.registerHelper('drawSlots', function name(value, isFill) {
    const result = [];
    const sides = ['one','two', 'three', 'four', 'five', 'six'];
    for (let index = 1; index <= value; index++) {
        result.push(`<i class="fa-${isFill ? 'solid' : 'light'} fa-dice-${sides[(index-1)%6]}"></i>`)
    }
    return result.join('')
})

Handlebars.registerHelper( 'loopTrack', function (min, max, current, track, sort) {
    let result = ``;
    switch (sort) {
        case 'asc':
            for ( let i = max ; i >= min ; i-- )
                result += `<label><input name="${track}" type="radio" value=${i} ${i == current ? 'checked' : ''}/>${i}</label>`;
            break;
        case 'desc':
            for ( let i = min ; i <= max ; i++ )
                result += `<label><input name="${track}" type="radio" value=${i} ${i == current ? 'checked' : ''}/>${i}</label>`;
            break;
        default:
            console.warn(`Don't set sort flag`)
            break;
    }
    return result
})

Handlebars.registerHelper( 'lockGearName', function (name) {
    return game.i18n.localize(`GEAR.${name}.name`);
} )