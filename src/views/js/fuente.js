$(document).ready(function () {

    $('#ano').change(function() {
        var year = $(this).val(); 

        $.ajax({
            url: '/fuente_mes/' + year,
            type: 'GET',
            success: function(response) {

                $('#mes').empty();

                $('#mes').append('<option value="" disabled selected>Seleccione un mes</option>');
                $.each(response, function(index, month) {
                    var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    $('#mes').append('<option value="' + month + '">' + monthNames[parseInt(month) - 1] + '</option>');
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });

    $('#generar').on('click', function() {

        var ano = $('#ano').val();
        var mes = $('#mes').val();
        
        if (!ano || !mes) {
            swal("Error", "Seleccione fecha y año para continuar.", "error");

            return;
        }

        var data = { ano, mes };

        $.ajax({
            url: '/generar',
            type: 'POST',
            data: data,
            dataType: 'text',
            beforeSend: function () {
                swal({
                    title: "Generando archivo",
                    text: "Espere un momento por favor...",
                    imageUrl: "/img/Spinner-1s-200px2.gif",
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
            }
        }).done(function (response) {
            if (response === "ok") {
                swal({
                    title: "Archivo creado",
                    text: "Se ha creado un archivo excel",
                    type: "success",
                    confirmButtonText: "Descargar",
                    allowOutsideClick: false
                }, function (isConfirm) {
                    if (isConfirm) {
                        window.location.href = "/descarga_fuente/"+ano+"-"+mes;
                    }
                });
            } else {
                swal("Error", "No se pudo generar la plantilla", "error");
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Error en la llamada AJAX:", textStatus, errorThrown);
            swal("Error", "Hubo un problema al comunicarse con el servidor", "error");
        });

    });
});

