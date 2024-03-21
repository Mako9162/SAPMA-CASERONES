function confirmar(Id){
    
    swal({
        title: "¿Esta Seguro?",
        text: " A continuación eliminará un usuario",
        type: "error",
        showCancelButton: true,
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
    },
    function(isConfirm) {
        if (isConfirm) {
            window.location = "/users/delete/"+Id;
        }
    });
}

$(document).ready(function () {

    $('#tabla_users').DataTable({
        'columnDefs': [
            {
                'targets': 0,
                'checkboxes': {
                    'selectRow': true
                }
            }
        ],
        'select': {
            'style': 'multi'
        },
        'order': [[0, 'asc']],
        "dom": 'Bfrtip',
        "searching": true,
        "lengthChange": false,
        "colReorder": true,
        "buttons": [{
                "extend": 'excelHtml5',
                "text": '<i class="fa fa-file-excel-o"></i>',
                "titleAttr": 'Exportar a Excel',
                "className": 'btn btn-rounded btn-success',
        }],
        "bDestroy": true, 	
        "scrollX": true,
        "bInfo": true,
        "iDisplayLength": 20,
        "autoWidth": false,
        "language": {
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
            "sInfo": "Mostrando un total de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando un total de 0 registros",
            "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
            "sInfoPostFix": "",
            "sSearch": "Buscar:",
            "sUrl": "",
            "sInfoThousands": ".",
            "sLoadingRecords": "Cargando...",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            },
            "oAria": {
                "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
                "sSortDescending": ": Activar para ordenar la columna de manera descendente"
            },
            "select" : {
                "rows" : {
                    "_" : "Has seleccionado %d filas",
                    "0" : "Click en una fila para seleccionar",
                    "1" : "Has seleccionado 1 fila"
                }
            }
        },
    });

    //Crear usuario
    $('#btnCrear').click(function(){
        option = 'add';
        id = null;
        $('#usuario_form').trigger('reset');
        $('#mdltitulo').html('Nuevo Usuario');
        $('#modalmantenimiento').modal('show');
        
    });
                                                                                                    
    //Formulario crear y editar plan
    $('#usuario_form').submit(function(e){
        e.preventDefault();
        var datos=$(this).serialize();
        $.ajax({
            url:'/users/add',
            type:'POST',
            data:datos,
            success:function(data){
            $('#modalmantenimiento').modal('hide');
            swal({
                title: "¡Bien hecho!",
                text: "El usuario se ha guardado correctamente",
                type: "success",
                confirmButtonClass: "btn-success",
                confirmButtonText: "Aceptar",
                closeOnConfirm: false
            },
            function() { 
                console.log(data);
                window.location.href = "/users/edit/" + data.userId; 

                setTimeout(function() {
                    $.ajax({
                        url:'/mail_user/'+data.userPass1+'/'+data.userId,
                        type:'POST',
                        data:datos,
                    })
                }, 100);

            });
            }
        });
    });

});
