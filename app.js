(function (global, _, $) {

    var apiUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?q={city}&mode=json&units=metric&cnt=7",
        $input = $('#textInput'),
        $results = $('#results');


    // Helpers:
    var log = _.curry(function (msg, val) { console && console.log && console.log(msg + ': ', val); return val; });
    var clearEl = _.curry(function ($el, data) {
        $el.empty();
        return data;
    });
    var render = _.curry(function (tpl, fn, data) {
        $results.append(tmpl(tpl, fn(data)));
        return data;
    });

    // Main functions:
    function getWeather (city) {
        return $.ajax({
            url: apiUrl.replace('{city}', global.encodeURI(city)),
            dataType: 'jsonp'
        }).promise();
    }
    var processResults = _.compose(
        _.map(render("day_weather_tmpl", _.get('temp'))),
        _.get('list'),
        render("city_tmpl", _.compose(log('Received for'), _.pick(['name', 'country']), _.get('city'))),
        clearEl($results)
    );
    function subscribe (stream, success, error) {

    }
    function main($input, $results) {

        // Retrieve input text:
        var inputStream = Rx.Observable.fromEvent($input, 'keyup')
            .map(_.compose(_.get('value'),_.get('target')))
            .throttle(750)
            .filter(function (text) {
                return text.length > 2;
            })
            .distinctUntilChanged(log('User query'));

        // Retrieve weather results:
        var weatherStream = inputStream.flatMapLatest(getWeather);

        // Render:
        var subscription = weatherStream.subscribe(
            processResults,
            function (error) {
                // Handle any errors
                $results.empty();
                dir(error); global.e1 = error;

                $('<li>Error: ' + error + '</li>').appendTo($results);
            });
    }

    main($input, $results);

}(this, ramda, jQuery));