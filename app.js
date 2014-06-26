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
    var noop = function (a) { return a; };
    var render = _.curry(function ($el, tpl, fn, data) {
        $el.append(tmpl(tpl, fn(data)));
        return data;
    })($results);

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
    var subscribeLoop = _.curry(function ($el, stream, process) {
        stream.subscribe(
            process,
            // resubscribe on error:
            function (error) {
                $el.empty();
                render('error_tmpl', noop, {});
                subscribeLoop(stream, process);
            }
        );
    })($results);
    function main($input) {

        // Retrieve input text:
        var inputStream = Rx.Observable.fromEvent($input, 'keyup')
            .map(_.compose(_.get('value'),_.get('target')))
            .throttle(50)
            .filter(function (text) {
                return text.length > 2;
            })
            .distinctUntilChanged(log('User query'));

        // Retrieve weather results:
        var weatherStream = inputStream.flatMapLatest(getWeather);

        // Prepare results and render:
        subscribeLoop(weatherStream, processResults)
    }

    main($input);

}(this, ramda, jQuery));