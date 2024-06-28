import cbrItem from "./module/sheets/item.js";
import cbrActor from "./module/sheets/runner.js";
import {} from "./extensions/tagify/polyfills.min.js";
import {} from "./extensions/tagify/tagify.js";
// import {} from "./extensions/html2canvas/html2canvas.min.js";

Hooks.once("init", function () {
    console.log('Start');

    Items.unregisterSheet("core",ItemSheet);
    Items.registerSheet("cbr", cbrItem, {makeDefault: true});

    Actors.unregisterSheet("core",ActorSheet);
    Actors.registerSheet("cbr", cbrActor, {makeDefault: true});
});

// Custom HandelBars
Handlebars.registerHelper("for", function(options, elem) {
    let result = ``;
    for (let i = 0 ; i < options ; i++)
        result += elem.fn(this).replace('#{i}', i);
    return result;
});

Handlebars.registerHelper('isBigger', function (max, value) {
    return value <= max;
});

Handlebars.registerHelper('isEqual', function (max, value) {
    return value == max;
});