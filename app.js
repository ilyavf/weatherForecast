(function (global, _, $) {

    var apiUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?q={city}&mode=json&units=metric&cnt=7&APPID=aabbdb9c7cddf1e33f12b2be0b8c6ec1",
        $input = $('#textInput'),
        $results = $('#results'),
        ctx = $("#dayNightTempChart").get(0).getContext("2d");

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
    function avg (list) {
        return { avg: _.sum(list)/list.length };
    }


    // Main functions:
    function getWeather (city) {
        return $.ajax({
            url: apiUrl.replace('{city}', global.encodeURI(city)),
            dataType: 'jsonp'
        }).promise();
    }

    function drawChart (items) {
        var data = {
            labels : ["Today","Tomorrow","+2 Days","+3 Days","+4 Days","+5 Days","+6 Days"],
            datasets : [{
                fillColor : "rgba(250,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
                data : _.map(_.compose(_.get('day'), _.get('temp')), items)
            },{
                fillColor : "rgba(151,187,205,0.5)",
                strokeColor : "rgba(151,187,205,1)",
                data : _.map(_.compose(_.get('night'), _.get('temp')), items)
            }]
        };
        new Chart(ctx).Bar(data);
        return items;
    };

    var processResults = _.compose(
        drawChart,
        render("pressure_tmpl", _.compose(avg, _.map(_.get('pressure')))),
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