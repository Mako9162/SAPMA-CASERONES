$(document).ready(function() {

    var nuevoOrdenYDescripcion = obtenerOrdenYDescripcion();

    $("#ttareas").sortable({
        handle: ".handle", 
        update: function (event, ui) {
            $("#ttareas .draggable-item").each(function (index) {
                var nuevoOrden = index + 1;
                $(this).attr("id", nuevoOrden);
            });

            nuevoOrdenYDescripcion = obtenerOrdenYDescripcion();

        }
    });

    function obtenerOrdenYDescripcion() {
        return $("#ttareas .draggable-item").map(function (index) {
            var orden = index + 1;
            var descripcion = $(this).text().trim().replace(/☰\n/g, '').trim();
            return { orden: orden, descripcion: descripcion };
        }).get();
    }

    $("#act_prioridad").click(function () {

        swal({
            title: "¡SAPMA!",
            text: "¿Desea actualizar la prioridad de planificación?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false      
            },function(isConfirm) {
                if(isConfirm){
                    $.ajax({
                        url: '/act_prioridad',
                        type: 'POST',
                        data: { nuevoOrdenYDescripcion }
                    }).done(function(data){
                        swal({
                            title: "¡SAPMA!",
                            text: "Prioridad actualizada correctamente",
                            type: "success",
                            confirmButtonText: "Aceptar",
                            allowOutsideClick: false
                        });	
                    })
                }
            }
        );
    });

    $('#actvariable').on('click', function () {
        var nuevoMaximo = $('#maximo').val();
        
        var data = {nuevoMaximo}

        swal({
            title: "¡SAPMA!",
            text: "¿Desea actualizar el máximo de tareas por día?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false      
            },function(isConfirm) {
                if(isConfirm){
                    $.ajax({
                        url: '/actualizamaximo',
                        type: 'POST',
                        data: data
                    }).done(function(data){
                        swal({
                            title: "¡SAPMA!",
                            text: "Máximo actualizado correctamente",
                            type: "success",
                            confirmButtonText: "Aceptar",
                            allowOutsideClick: false
                        });	
                        $('#maximo_tareas').modal('hide');
                    })
                }
            }
        );	
    });
    
});