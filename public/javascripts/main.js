$(function () {

    console.log('init');
    $('input[type=radio]').change(function () {
        var value = $(this).val();
        var elemId = parseInt($(this).parent().attr('id'));

        console.log(value);
        console.log(parseInt($(this).parent().attr('id')));


        $.post(
            '/table/voting',
            { evaluation: value, id: elemId },
            function (data) {
                if (data) {
                    $('.status .successful').text('successful');
                    setTimeout(function(){$('.status .successful').text('')},1000);
                }
            }
        );
    });

    $('#edit-form button').on('click', function () {
        console.log('save');
        var id = $('#edit-form').parent().attr('id');
        console.log(id);
        var question = $('#questionInput').val();
        var solution = $('#solutionInput').val();
        $.post(
            '/table/edit',
            { id: id, question: question, solution: solution },
            function (data) {
                if (data) {
                    console.log(data);
                }
            }
        );
    });

    $('#create-form button').on('click', function () {
        console.log('create');
        var question = $('#questionInput').val();
        var solution = $('#solutionInput').val();
        $.post(
            '/table/create',
            {question: question, solution: solution },
            function (data) {
                if (data) {
                    console.log(data);
                }
            }
        );
    });

    

});