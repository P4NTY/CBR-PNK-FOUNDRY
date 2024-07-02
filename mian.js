import cbrItem from "./module/sheets/item.js";
import cbrRunner from "./module/sheets/runner.js";
import cbrHunter from "./module/sheets/hunter.js";

Hooks.once("init", function () {
    console.log('Start');

    Items.unregisterSheet("core",ItemSheet);
    Items.registerSheet("cbr", cbrItem, {makeDefault: true});

    Actors.unregisterSheet("core",ActorSheet);
    Actors.registerSheet("cbr", cbrRunner, {types: ["runner"],makeDefault: true});
    Actors.registerSheet("cbr", cbrHunter, {types: ["hunter"],makeDefault: true});
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