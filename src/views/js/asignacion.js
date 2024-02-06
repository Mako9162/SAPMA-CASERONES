var table;
var table1;

$(document).ready(function() {

    function _(element)
    {
        return document.getElementById(element); 
    }

    function fetch_data(parent_element, child_element, type) {
        fetch('/get_datapla?type=' + type + '&parent_value=' + parent_element.value + '').then(function(response) {
            return response.json();
        }).then(function(responseData) {
            var html = '';

            if (type == 'load_areass') {
                html = '<option value="">Seleccione un área</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('area').innerHTML = html;
                _('sector').innerHTML = '<option value="">Seleccione un sector</option>';
                _('equipo').innerHTML = '<option value="">Seleccione un equipo</option>';

            } else if (type == 'load_sectoress') {
                html = '<option value="">Seleccione un sector</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('sector').innerHTML = html;
                _('equipo').innerHTML = '<option value="">Seleccione un equipo</option>';

            } else if (type == 'load_equiposs') {
                html = '<option value="">Seleccione un equipo</option>';
                for (var count = 0; count < responseData.length; count++) {
                    html += '<option value="' + responseData[count][0] + '">' + responseData[count][1] + '</option>';
                }

                _('equipo').innerHTML = html;
            }
        });
    }

    _('gerencia').onchange = function(){		
        fetch_data(_('gerencia'), _('area'), 'load_areass');
    };

    _('area').onchange = function(){
        fetch_data(_('area'), _('sector'), 'load_sectoress');
    };

    _('sector').onchange = function(){
        fetch_data(_('sector'), _('equipo'), 'load_equiposs');
    };

    function initDataTable() {
        table = $('#tabla_plan').DataTable({
            "searching": true,
            "lengthChange": false,
            "colReorder": true,
            'select': {
                'style': 'multi'
            },
            "dom": 'f<"botones">rtip',
            "bDestroy": true, 	
            "bInfo": true,
            "iDisplayLength": 10,
            "autoWidth": true,
            "scrollY": true, 
            "language": {
                "sProcessing": "Procesando...",
                "sLengthMenu": "Mostrar _MENU_ registros",
                "sZeroRecords": "No se encontraron resultados",
                "sEmptyTable": "Ningún dato disponible",
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

        $("div.botones").html('<button id="seleccionar" class="btn btn-inline btn-secondary btn-sm">Seleccionar</button>'+
            '<button id="sin_ciclo" class="btn btn-inline btn-warning btn-sm">Sin ciclo</button>'
        )

        $('#seleccionar').on('click', function () {
            var visibleRows = table.rows({ search: 'applied' }).nodes();
    
            if (table.rows({ selected: true }).count() > 0) {
                table.rows().deselect();
            } else {
                table.rows(visibleRows).select();
            }
        });
    
        $('#sin_ciclo').on('click', function () {
            var columnaCiclo = table.column(7);
        
            if (columnaCiclo.search() === 'Sin ciclo asignado') {
                columnaCiclo.search('').draw();
            } else {
                columnaCiclo.search('Sin ciclo asignado').draw();
            }
        });
        
    }

    initDataTable();

    $('#filtrar').click(function () {
        var gerencia = $('#gerencia').val();
        var area = $('#area').val();
        var sector = $('#sector').val();
        var equipo = $('#equipo').val();
    
        var data = {
            gerencia: gerencia,
            area: area,
            sector: sector,
            equipo: equipo
        };
    
        swal({
            title: "Cargando",
            text: "Espere un momento por favor...",
            imageUrl: "/img/Spinner-1s-200px2.gif",
            showConfirmButton: false,
            allowOutsideClick: false
        });
    
        $.ajax({
            url: '/buscar_plan',
            type: 'POST',
            data: data
        }).done(function (data) {
            swal.close();
    
            if ($.fn.DataTable.isDataTable('#tabla_plan')) {
                table.clear().destroy();
            }
    
            $('#tabla_plan tbody').empty();
    
            data.forEach(function (item) {
                var ciclo = item.CICLO !== null ? item.CICLO : "Sin ciclo asignado";
                $('#tabla_plan tbody').append(`
                    <tr>
                        <td>${item.ID}</td>
                        <td>${item.CODIGO}</td>
                        <td hidden="true">${item.IDTP}</td>
                        <td>${item.TIPO}</td>
                        <td>${item.GER}</td>
                        <td>${item.AREA}</td>
                        <td>${item.SECTOR}</td>
                        <td>${ciclo}</td>
                    </tr>
                `);
            });
    
            initDataTable();
        });
    });
    
    $('#asignar').on('click', function () {
        var filasSeleccionadas = table.rows({ selected: true }).count();
        if (filasSeleccionadas > 0) {
        swal({
            title: "¡SAPMA!",
            text: "A continuacion modificará el ciclo de los equipos seleccionados. Esto no afectará las tareas planificadas del equipo. El nuevo ciclo será considerado en la planificación de las tareas futuras.",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true
        }, function(isConfirm){
            if(isConfirm){
                    var tipo_equipo = table.rows({ selected: true }).data();
                    var datosFilas = tipo_equipo.toArray();
            
                    var idsUnicos = new Set();
            
                    datosFilas.forEach(function (fila) {
                        var valorUnico = [fila[2], fila[3]];
                        idsUnicos.add(JSON.stringify(valorUnico));
                    });
            
                    var valoresUnicos = Array.from(idsUnicos).map(JSON.parse);
            
                    $('#equipo_info').empty();   
                    valoresUnicos.forEach(async function (valor, index) {
                        $('#equipo_info').append(`
                            <div class="col-md-5">
                                <input class="form-control" type="text" data-equipo="${valor[0]}" value="${valor[1]}" disabled>
                            </div>    
                        `);
            
                        var selectId = `select_${index}`;
            
                        $('#equipo_info').append(`
                            <div class="col-md-5">
                                <select class="select2 ciclo-info" id="${selectId}" data-index="${index}">
                                    <option values="" disabled selected>Seleccione un ciclo</option>
                                </select>
                            </div>
                        `);
            
                        $.ajax({
                            url: '/detalle_ciclo',
                            type: 'POST',
                            success: function (data) {
                                data.forEach(function (detalle) {
                                    var selectElement = $(`#${selectId}`);
                                    if (detalle.EQUIPO === valor[0]) {
                                        selectElement.append(`
                                            <option value="${detalle.ID}" data-detalle-id="${detalle.ID}">${detalle.DETALLE}</option>
                                        `);
                                    }
                                    selectElement.addClass('select2');
                                    selectElement.select2();
                                });
                            },
                            error: function (error) {
                                console.log(error);
                            }
                        });
            
                        $('#equipo_info').append(`
                            <div class="col-md-2">
                                <button class="btn btn-inline btn-secondary detalle-ciclo" data-index="${index}"><i class="fa fa-eye"></i></button>
                            </div>    
                        `);
        
                    });
            
                    $('#equipo_info').on('click', '.detalle-ciclo', function () {
                        event.preventDefault();
                        var buttonIndex = $(this).data('index');
                        var selectId = `select_${buttonIndex}`;
                        var idCiclo = $(`#${selectId} option:selected`).data('detalle-id');
            
                        $('#titulo_detalle_ciclo').text('Detalle de ciclo');
        
                        if(!idCiclo){
                            swal("Error", "Seleccione una opción", "error");
                            return;
                        };
                        $.ajax({
                            url: '/obtenerDetallesCiclo/' + idCiclo,
                            type: 'GET',
                            success: function (data) {
                                
                                var nombre = data[0].NOMBRE;
                                var tipo_equipo = data[0].TIPO_EQUIPO;
                
                                $('#nombre_detalle_ciclo').val(nombre);
                                $('#tipo_equipo_detalle_ciclo').val(tipo_equipo);
                
                                $('#tabla_detalle_ciclo tbody').empty();
                    
                                data.forEach(function (detalle) {
                                    $('#tabla_detalle_ciclo tbody').append(
                                        '<tr>' +
                                        '<td>' + detalle.TIPO_ABREVIADO + '</td>' +
                                        '<td>' + detalle.PERIODICIDAD + '</td>' +
                                        '<td>' + detalle.PERIODO + '</td>' +
                                        '</tr>'
                                    );
                                });
                                
                            },
                            error: function (error) {
                                console.log(error);
                            }
                        });
                
                        $('#detalle_ciclo').modal('show');
                    });
            
                    $('#asigna_equipo').modal('show');
                
            }
        });
        } else {
            swal("Error", "Debe seleccionar uno o varios equipos para asignar un ciclo", "error");
        }
    });
    
    $('#detalle_ciclo').on('hidden.bs.modal', function () {
        $('#nombre_detalle_ciclo').val('');
        $('#tipo_equipo_detalle_ciclo').val('');
        $('#tabla_detalle_ciclo tbody').empty();
    });
    
    $('#asignar_ciclo').on('click', function () {
        var filasData = [];
    
        $('#equipo_info .col-md-5 input[data-equipo]').each(function () {
            var valorInputOculto = $(this).data('equipo');
            var selectId = $(this).closest('.col-md-5').next('.col-md-5').find('select').attr('id');
            var valorSelect = $(`#${selectId} option:selected`).data('detalle-id');
    
            if (!valorSelect) {
                swal("Error", "Seleccione los ciclos para continuar", "error");
                return;
            }
    
            var filaData = {
                valorInputOculto,
                valorSelect
            };
    
            filasData.push(filaData);
        });
    
        var filasSeleccionadas = table.rows({ selected: true }).data();
        var datosFilas = filasSeleccionadas.toArray();
    
        var data = {
            idsSeleccionados: datosFilas.map(function (fila) {
                return [fila[0], fila[2]];
            })
        };
    
        var datos = data.idsSeleccionados.map(function (idSeleccionado) {
            var encontrado = filasData.find(function (filaData) {
                return filaData.valorInputOculto.toString() === idSeleccionado[1];
            });
    
            return encontrado ? idSeleccionado.concat([encontrado.valorSelect]) : null;
        }).filter(function (elemento) {
            return elemento !== null;
        });
    
        swal({
            title: "¡SAPMA!",
            text: "¿Desea agregar los ciclos a los equipos seleccionados?",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: true
        }, function(isConfirm){
            if(isConfirm){
                $('#asigna_equipo').modal('hide');
                $.ajax({
                    url: '/asigna_ciclo',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(datos),
                    beforeSend: function(){
                        swal({
                            title: "Actualizando",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    }
                }).done(function(data){
                    swal({
                        title: "¡SAPMA!",
                        text: "Equipos actualizados correctamente",
                        type: "success",
                        confirmButtonText: "Aceptar",
                        allowOutsideClick: false
                    });	
                    setTimeout(function () {
                        location.reload();
                    }, 1000);	
                })
            }
        });

    });

});
