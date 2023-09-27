function _(element)
{
    return document.getElementById(element); 
}

function fetch_data( parent_element, child_element, type)
{
    fetch('/get_datapla?type='+type+'&parent_value='+parent_element.value+'').then(function(response){
        return response.json();
    }).then(function(responseData){

        var html = '';

        if(type == 'load_areass'){
            html = '<option value="">Seleccione un área</option>';
            for(var count = 0; count < responseData.length; count++)
            {
                html += '<option value="'+responseData[count][0]+'">'+responseData[count][1]+'</option>';    
            }
            
        }

        if(type == 'load_sectoress'){
            html = '<option value="">Seleccione un sector</option>';
            for(var count = 0; count < responseData.length; count++)
            {
                html += '<option value="'+responseData[count][0]+'">'+responseData[count][1]+'</option>';    
            }
        }

        if(type == 'load_equiposs'){
            html = '<option value="">Seleccione un equipo</option>';
            for(var count = 0; count < responseData.length; count++)
            {
                html += '<option value="'+responseData[count][0]+'">'+responseData[count][1]+'</option>';    
            }
        }

        child_element.innerHTML = html;
    });
}

_('gerencia').onchange = function(){			
    fetch_data(_('gerencia'), _('area'), 'load_areass');
    $('#area').prop('disabled', false);
};

_('area').onchange = function(){
    fetch_data(_('area'), _('sector'), 'load_sectoress');
    $('#sector').prop('disabled', false);
};

_('sector').onchange = function(){
    fetch_data(_('sector'), _('equipo'), 'load_equiposs');
    $('#equipo').prop('disabled', false);
};

$(document).ready(function() {

    $('#asignar').on('click', function() {
        $('#myModal1').modal('show');
    });

    var table;

    function initDataTable() {
        table = $('#tabla_plan').DataTable({
            "searching": true,
            "lengthChange": false,
            "colReorder": true,
            'select': {
                'style': 'multi'
            },
            "dom": 'Bfrtip',
            "buttons": [
                {
                    "text": '<label>Seleccionar Todo</label>',
                    "className": 'btn btn-secondary',
                    "action": function () {
                        if (table.rows({ selected: true }).count() > 0) {
                            table.rows().deselect();
                            this.text('Seleccionar Todo');
                        } else {
                            table.rows().select();
                            this.text('Deseleccionar Todo');
                        }
                    }
                }
            ],
            "bDestroy": true, 	
            "bInfo": true,
            "iDisplayLength": 10,
            "autoWidth": true,
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
            }
        });
    }

    initDataTable(); // Inicializar DataTables al principio

    $('#buscar').click(function() {
        var gerencia = $('#gerencia').val();
        var area = 	$('#area').val();
        var sector = $('#sector').val();
        var equipo = $('#equipo').val();

        var data = {
            gerencia: gerencia,
            area: area,  
            sector: sector,
            equipo: equipo
        };

        $.ajax({
            url: '/buscar_plan',
            type: 'POST',
            data: data
        }).done(function(data) {
            // Destruir la instancia DataTable actual antes de agregar datos
            if ($.fn.DataTable.isDataTable('#tabla_plan')) {
                table.clear().destroy();
            }

            // Limpiar la tabla actual
            $('#tabla_plan tbody').empty();

            // Verificar si hay datos en la respuesta
            if (data.length === 0) {
                // Mostrar un mensaje de "Sin Información"
                $('#tabla_plan tbody').append(`
                    <tr>
                        <td colspan="6"><center>Sin Información</center></td>
                    </tr>
                `);
                
            } else {
                // Iterar sobre los datos recibidos y agregarlos a la tabla
                data.forEach(function(item) {
                    $('#tabla_plan tbody').append(`
                        <tr>
                            <td>${item.ID}</td>
                            <td>${item.CODIGO}</td>
                            <td>${item.TIPO}</td>
                            <td>${item.GER}</td>
                            <td>${item.AREA}</td>
                            <td>${item.SECTOR}</td>
                        </tr>
                    `);
                });

                // Inicializar DataTables nuevamente después de agregar datos
                initDataTable();
            }
        });
    });

});
