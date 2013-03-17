$(document).ready(function () {

    var socket = io.connect();
    var itemsBought = 0;
    var log = [];

    $('#sender').bind('click', function () {

        $.post("/order", { message: "buy" })
            .done(function (data) {
                if (data.sold == 'yes') {
                    itemsBought++;
                    $('#itemsBought').text(itemsBought);
                }
            });
    });

    $('#admin').bind('click', function () {

        $.post("/admin", { counter: 88 })
            .done(function (data) {
                console.log(data);
            });
    });

    socket.on('server_message', function (data) {
        if (data > 0) {
            $('#receiver').text(data);
        }
        else {
            $('#receiver').text('Sold!');
            $('#lastdeal').text('Too late!');
        }

        if (data > 0 && data <= 5) {
            $('#lastdeal').text('Hurry up!');
        }
    });

    socket.on('log', function (data) {
        var logItem = $('.logItem');
        var itemCount = logItem.length;
        var logEntry = '<div class="logItem" id="logItem' + itemCount + '">' + data + '</div>';

        var logContainer = $('#log');
        if (itemCount == 0) {
            logContainer.append(logEntry);

        } else {
            if (itemCount == 5) {
                logItem.last().remove();
            }
            if (itemCount > 0) {
                logItem.first().before(logEntry);
            }
        }
        logContainer.children().fadeOut(5000);
    });

    var url = document.URL;
    if (url.indexOf('/user/') !== -1) {
        var userId = url.substring(url.lastIndexOf('/') + 1, url.length);
        if (userId !== undefined) {
            socket.emit('userId', userId);
        }
    }

});