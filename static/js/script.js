$(document).ready(function () {

    var socket = io.connect();
    var itemsBought = 0;

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
});