const handlebars = require('handlebars'),
groupBy = require('handlebars-group-by');

groupBy(handlebars);

handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper("incitement", function (inindex) {
    return inindex + 1;
});

handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});


  


  