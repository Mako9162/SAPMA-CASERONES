var table;
var table1;
var table2;

$(document).ready(function () {

    table = $('#lista_ciclo').DataTable({
        "dom": 'f<"toolbar">rtp',
        'select': {
            'style': 'single'
        },
        "bInfo": true,
        "iDisplayLength": 8,
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

    $('#lista_ciclo tbody').on('click', 'tr', function () {
        $('#lista_ciclo tbody tr').removeClass('selected');
        $(this).addClass('selected');
    
        var data = table.row(this).data();
        var idCiclo = data[0];
    
        $.ajax({
            url: '/obtenerDetallesCiclo/' + idCiclo,
            type: 'GET',
            success: function (data) {
                
                $('#tabla_detalle tbody').empty();
    
                data.forEach(function (detalle) {
                    $('#tabla_detalle tbody').append(
                        '<tr data-id="' + detalle.ID + '">' +
                        '<td>' + detalle.NOMBRE + '</td>' +
                        '<td>' + detalle.TIPO_ABREVIADO + '</td>' +
                        '<td>' + detalle.PERIODICIDAD + '</td>' +
                        '<td>' + detalle.PERIODO + '</td>' +
                        '<td><button class="btn btn-inline btn-warning btn-sm ladda-button edit-btn"><i class="fa fa-edit"></i></button>' +
                        '<button class="btn btn-inline btn-danger btn-sm ladda-button trash-btn"><i class="fa fa-trash"></i></button></td>' +
                        '</tr>'
                    );
                });
                
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("div.toolbar").html('<button id="boton-editar" class="btn btn-inline btn-warning btn-sm ladda-button"><i class="fa fa-edit"></i></button>'+
    '<button id="boton-eliminar" class="btn btn-inline btn-danger btn-sm ladda-button"><i class="fa fa-trash"></i></button>'+
    '<button id="duplicar" class="btn btn-inline btn-secondary btn-sm">Duplicar ciclo</button></a>	');

    table1 = $('#tabla_detalle').DataTable({
        "dom": '<"detalle">rt',
        'select': {
            'style': 'single'
        },
        "bInfo": true,
        "iDisplayLength": 8,
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

    table2 = $('#tabla_duplicar').DataTable({
        "dom": 'rt',
        'select': {
            'style': 'single'
        },
        "bInfo": true,
        "iDisplayLength": 8,
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

    $('#tabla_detalle tbody').on('click', '.edit-btn', function () {
        var row = $(this).closest('tr');
        var idDetalle = row.data('id');
        var nombreDetalle = row.find('td').eq(0).text(); 
        var tareaDetalle = row.find('td').eq(1).text(); 
        var periodicidadDetalle = row.find('td').eq(2).text(); 
        var periodoDetalle = row.find('td').eq(3).text(); 

        $('#if_fila').val(idDetalle);
        $('#tareaDetalle_fila').val(tareaDetalle);
        $('#periodicidadDetalle_fila').val(periodicidadDetalle);
        $('#periodoDetalle_fila').val(periodoDetalle);
 
        $.ajax({
            url: '/edit_ciclo/' + idDetalle,
            type: 'GET',
            success: function (data) {
                var selectTTAREA = $('#tipo_protocolo');
                $('#titulo_ciclo_ed').text('Editar configuración del ciclo - ' + nombreDetalle);
                selectTTAREA.empty();
    
                data.prot.forEach(function (protocolo) {
                    var optionTTAREA = $('<option>', {
                        value: protocolo.ID,
                        text: protocolo.TIPO_ABREVIACION
                    });
    
                    if (protocolo.TIPO_ABREVIACION === tareaDetalle) {
                        optionTTAREA.prop('selected', true);
                    }
    
                    selectTTAREA.append(optionTTAREA);
                });
    
                var selectPeriodicidad = $('#periodicidad');
                var tipoPeriodoBlocks = $('#tipo_periodo_d, #tipo_periodo_s, #tipo_periodo_m, #tipo_periodo_a');
    
                selectPeriodicidad.find('option').filter(function() {
                    return $(this).text().trim() === periodicidadDetalle.trim();
                }).prop('selected', true);
    
                tipoPeriodoBlocks.hide();
    
                var selectedValue = selectPeriodicidad.val();
                if (selectedValue === "Diario") {
                    if (periodoDetalle.startsWith('TLD')) {
                        $('#todos_los_dias').prop('checked', true);
                    } else {
                        $('#cnd').prop('checked', true);
                        $('#d').val(periodoDetalle);
                    }
                    $('#tipo_periodo_d').show();
                } else if (selectedValue === "Semanal") {
                    if (periodoDetalle.startsWith('TLS')) {
                        $('#todas_las_semanas').prop('checked', true);
                    } else {
                        $('#cns').prop('checked', true);
                        $('#s').val(periodoDetalle);
                    }
                    $('#tipo_periodo_s').show();
                } else if (selectedValue === "Mensual") {
                    if (periodoDetalle.startsWith('TLM')) {
                        $('#todos_los_meses').prop('checked', true);
                    } else {
                        $('#cnm').prop('checked', true);
                        $('#m').val(periodoDetalle);
                    }
                    $('#tipo_periodo_m').show();
                } else if (selectedValue === "Anual") {
                    if (periodoDetalle.startsWith('TLA')) {
                        $('#todos_los_anos').prop('checked', true);
                    } else {
                        $('#cna').prop('checked', true);
                        $('#a').val(periodoDetalle);
                    }
                    $('#tipo_periodo_a').show();
                }
    
                selectPeriodicidad.on('change', function (){
                    tipoPeriodoBlocks.hide();
    
                    var selectedValue = $(this).val();
                    if (selectedValue === "Diario") {
                        $('#tipo_periodo_d').show();
                    } else if (selectedValue === "Semanal") {
                        $('#tipo_periodo_s').show();
                    } else if (selectedValue === "Mensual") {
                        $('#tipo_periodo_m').show();
                    } else if (selectedValue === "Anual") {
                        $('#tipo_periodo_a').show();
                    }
                });

                $('#todos_los_dias, #cnd').on('change', function() {
                    if ($('#todos_los_dias').prop('checked')) {
                        $('#d').val('');
                    } 
                });

                $('#todas_las_semanas, #cns').on('change', function() {
                    if ($('#todas_las_semanas').prop('checked')) {
                        $('#s').val('');
                    } 
                });

                $('#todos_los_meses, #cnm').on('change', function() {
                    if ($('#todos_los_meses').prop('checked')) {
                        $('#m').val('');
                    } 
                });

                $('#todos_los_anos, #cna').on('change', function() {
                    if ($('#todos_los_anos').prop('checked')) {
                        $('#a').val('');
                    } 
                });

                $('#periodicidad').on('change', function() {
                    $('input[name=optionsRadios]').prop('checked', false);
                    $('#d, #s, #m, #a').val('');
                });
                
    
            }, error: function (error) {
                console.log(error);
            }
        });

        $('#edit_fila').modal('show');
    }); 

    $('#edit_fila').on('hidden.bs.modal', function () {
        $('#todos_los_dias, #cnd, #todas_las_semanas, #cns, #todos_los_meses, #cnm, #todos_los_anos, #cna').prop('checked', false);
        $('#d, #s, #m, #a').val('');
    });
    
    $('#act_fila').on('click', function (){
        var tipo_protocolo = $('#tipo_protocolo').val();
        var periodicidad = $('#periodicidad').val();
        var id_fila = $('#if_fila').val();
        var tareaDetalle_fila = $('#tareaDetalle_fila').val();
        var periodicidadDetalle_fila = $('#periodicidadDetalle_fila').val();
        var periodoDetalle_fila = $('#periodoDetalle_fila').val();


        var radioPeriodoSeleccionado = $('input[name=optionsRadios]:checked');
        if (radioPeriodoSeleccionado.length > 0) {
            var inputNumero = radioPeriodoSeleccionado.closest('.radio').find('input[type=number]');
        
            if (inputNumero.length > 0) {
                var numero = inputNumero.val();
                if (numero === "" || isNaN(parseFloat(numero)) || parseFloat(numero) <= 0) {
                    swal("Error", "Por favor ingrese un número válido mayor a 0 para el ciclo seleccionado", "error");
                    return;
                }
            }
        } else {
            swal("Error", "Por favor seleccione un ciclo", "error");
            return;
        }
        
        var data = {
            id_fila,
            tareaDetalle_fila,
            periodicidadDetalle_fila,
            periodoDetalle_fila,
            tipo_protocolo,
            periodicidad
        };

        var radioSeleccionado = $('input[name=optionsRadios]:checked');

        if (radioSeleccionado.length > 0) {
            
            var inputNumero = radioSeleccionado.closest('.radio').find('input[type=number]');
            var valorInput = parseFloat(inputNumero.val());

            if (!isNaN(valorInput)) {
                data.periodo = valorInput;
            } else {
                data.periodo = radioSeleccionado.val();
            }
        } else {
            data.periodo = periodo;
        }

        swal({
        title: "¿Desea editar esta fila?",
        text: "Esto NO afectará a las tareas planificadas.",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
        },function(isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: "/editar_fila",
                    type: 'POST',
                    data:data,
                    beforeSend: function(){
                        swal({
                            title: "Editando",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    }
                }).done(function(data){
                    swal({
                        title: "¡SAPMA!",
                        text: "Fila editada correctamente",
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

    $('#tabla_detalle tbody').on('click', '.trash-btn', function () {
        var row = $(this).closest('tr');
        var idDetalle = row.data('id');
        var nombreDetalle = row.find('td').eq(0).text(); 
        var tareaDetalle = row.find('td').eq(1).text(); 
        var periodicidadDetalle = row.find('td').eq(2).text(); 
        var periodoDetalle = row.find('td').eq(3).text(); 

        var data = {
            idDetalle,
            tareaDetalle,
            periodicidadDetalle,
            periodoDetalle
        }

        swal({
            title: "¿Desea eliminar la fila de este ciclo?",
            text: "Esto NO eliminará las tareas planificadas.",
            type: "warning",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si",
            cancelButtonText: "No",
            closeOnConfirm: false      
            },function(isConfirm) {
                if(isConfirm){
                    $.ajax({
                        url: "/eliminar_fila",
                        type: 'POST',
                        data:data,
                        beforeSend: function(){
                            swal({
                                title: "Eliminando",
                                text: "Espere un momento por favor...",
                                imageUrl:"/img/Spinner-1s-200px2.gif",
                                showConfirmButton: false,
                                allowOutsideClick: false
                            });
                        }
                    }).done(function(data){
                        swal({
                            title: "¡SAPMA!",
                            text: "Fila eliminada correctamente",
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

    $("div.detalle").html('<button id="agrega_fila" class="btn btn-inline btn-primary btn-sm ladda-button float-right"><i class="fa fa-plus"></i></button>');

    $("#boton-editar").on('click', function(){

        var selectedRows = table.rows({ selected: true });

        if (selectedRows.count() !== 1) {
            swal("¡SAPMA!", "Debes seleccionar una fila para editar.", "error");
        }else{
            var idCiclo = table.row('.selected').data()[0];

            $.ajax({
                url: '/edit_ciclo/' + idCiclo,
                type: 'GET',
                success: function (data) {

                    $('#id_ciclo').val(data.ciclo[0].ID);
                    $('#act_nombre').val(data.ciclo[0].NOMBRE);
                    var selectTipoEquipo = $('#act_tipo_equipo');
                    selectTipoEquipo.empty();

                    data.tequipo.forEach(function (tipo) {
                        var option = $('<option>', {
                            value: tipo.Id,
                            text: tipo.Descripcion
                        });
        
                        if (tipo.Id === data.ciclo[0].IDTE) {
                            option.prop('selected', true);
                        }
        
                        selectTipoEquipo.append(option);
                    });
                $('#edit_ciclo').modal('show');

                },error: function (error) {
                    console.log(error);
                }

            });
        }

    });

    $('#actualizar').on('click', function (){
        const id = $('#id_ciclo').val();
        const nombre = $('#act_nombre').val();
        const tipo_equipo = $('#act_tipo_equipo').val();

        const data = {
            id,
            nombre,
            tipo_equipo
        }

        swal({
        title: "¿Desea actualizar esta información?",
        text: "Esto NO eliminará las tareas planificadas.",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
        },function(isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: "/actualizar",
                    type: 'POST',
                    data:data,
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
                        text: "Ciclo actualizado correctamente",
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

    $('#boton-eliminar').on('click', function () {
    
        var selectedRows = table.rows({selected: true});
        
        if (selectedRows.count() != 1) {
            swal("¡SAPMA!", "Debes seleccionar al menos una fila para eliminar.", "error");
        } else {

        var idRegistro = table.row('.selected').data()[0];

        swal({
        title: "¿Desea eliminar este ciclo?",
        text: "Esto NO eliminará las tareas planificadas.",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
        },function(isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: "/eliminar_ciclo/"+idRegistro,
                    type: 'POST',
                    beforeSend: function(){
                        swal({
                            title: "Eliminando",
                            text: "Espere un momento por favor...",
                            imageUrl:"/img/Spinner-1s-200px2.gif",
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                    }
                }).done(function(data){
                    swal({
                        title: "¡SAPMA!",
                        text: "Ciclo eliminado correctamente",
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
        }	
    });

    $('#agrega_fila').on('click', function () {
        var selectedRows = table.rows({ selected: true });
    
        if (selectedRows.count() != 1) {
            swal("¡SAPMA!", "Seleccione un ciclo de planificación.", "error");
        } else {
            var idDetalle = table.row('.selected').data()[0];
            var nombreDetalle = table.row('.selected').data()[1];
            $('#id_fila_i').val(idDetalle);
            $('#titulo_ciclo_i').text('Insertar fila al ciclo - ' + nombreDetalle);
            $.ajax({
                url: '/edit_ciclo/' + idDetalle,
                type: 'GET',
                success: function (data) {
                    var selectTTAREA = $('#tipo_protocolo_i');
                    selectTTAREA.empty();
                    selectTTAREA.append('<option value="" disabled selected>Seleccione una opción</option>');
                    
                    data.prot.forEach(function (protocolo) {
                        var optionTTAREA = $('<option>', {
                            value: protocolo.ID,
                            text: protocolo.TIPO_ABREVIACION
                        });
                        selectTTAREA.append(optionTTAREA);
                    });
    
                    var selectPeriodicidad = $('#periodicidad_i');  
                    selectPeriodicidad.empty();
                    selectPeriodicidad.append('<option value="" disabled selected>Seleccione una opción</option>'+
                    '<option value="Diario">Diario</option>'+
                    '<option value="Semanal">Semanal</option>'+
                    '<option value="Mensual">Mensual</option>'+
                    '<option value="Anual">Anual</option>)'); 
                    var tipoPeriodoBlocks = $('#tipo_periodo_d_i, #tipo_periodo_s_i, #tipo_periodo_m_i, #tipo_periodo_a_i');
                    tipoPeriodoBlocks.hide();
    
                    selectPeriodicidad.on('change', function (){
                        tipoPeriodoBlocks.hide();
        
                        var selectedValue = $(this).val();
                        if (selectedValue === "Diario") {
                            $('#tipo_periodo_d_i').show();
                            $('#todos_los_dias_i, #cnd_i, #todas_las_semanas_i, #cns_i, #todos_los_meses_i, #cnm_i, #todos_los_anos_i, #cna_i').prop('checked', false);
                            $('#d_i, #s_i, #m_i, #a_i').val('');
                        } else if (selectedValue === "Semanal") {
                            $('#tipo_periodo_s_i').show();
                            $('#todos_los_dias_i, #cnd_i, #todas_las_semanas_i, #cns_i, #todos_los_meses_i, #cnm_i, #todos_los_anos_i, #cna_i').prop('checked', false);
                            $('#d_i, #s_i, #m_i, #a_i').val('');
                        } else if (selectedValue === "Mensual") {
                            $('#tipo_periodo_m_i').show();
                            $('#todos_los_dias_i, #cnd_i, #todas_las_semanas_i, #cns_i, #todos_los_meses_i, #cnm_i, #todos_los_anos_i, #cna_i').prop('checked', false);
                            $('#d_i, #s_i, #m_i, #a_i').val('');
                        } else if (selectedValue === "Anual") {
                            $('#tipo_periodo_a_i').show();
                            $('#todos_los_dias_i, #cnd_i, #todas_las_semanas_i, #cns_i, #todos_los_meses_i, #cnm_i, #todos_los_anos_i, #cna_i').prop('checked', false);
                            $('#d_i, #s_i, #m_i, #a_i').val('');
                        }
                    });
    
                    $('#todos_los_dias_i, #cnd_i').on('change', function() {
                        if ($('#todos_los_dias_i').prop('checked')) {
                            $('#d_i').val('');
                        } 
                    });
    
                    $('#todas_las_semanas_i, #cns_i').on('change', function() {
                        if ($('#todas_las_semanas_i').prop('checked')) {
                            $('#s_i').val('');
                        } 
                    });
    
                    $('#todos_los_meses_i, #cnm_i').on('change', function() {
                        if ($('#todos_los_meses_i').prop('checked')) {
                            $('#m_i').val('');
                        } 
                    });
    
                    $('#todos_los_anos_i, #cna_i').on('change', function() {
                        if ($('#todos_los_anos_i').prop('checked')) {
                            $('#a_i').val('');
                        } 
                    });
    
                    $('#periodicidad_i').on('change', function() {
                        $('input[name=optionsRadios_i]').prop('checked', false);
                        $('#d_i, #s_i, #m_i, #a_i').val('');
                    });
    
                }, error: function (error) {
                    console.log(error);
                }
            });
    
            $('#new_fila').modal('show');
        }
    });

    $('#new_fila').on('hidden.bs.modal', function () {
        $('#todos_los_dias_i, #cnd_i, #todas_las_semanas_i, #cns_i, #todos_los_meses_i, #cnm_i, #todos_los_anos_i, #cna_i').prop('checked', false);
        $('#d_i, #s_i, #m_i, #a_i').val('');
    });
    
    $('#inserta_fila').on('click', function () {
        var id = $('#id_fila_i').val();
        var tipo_protocolo = $('#tipo_protocolo_i').val();
        var periodicidad = $('#periodicidad_i').val();
    
        if (!tipo_protocolo || !periodicidad) {
            swal("Error", "Por favor complete y seleccione todos los campos", "error");
            return;
        }
    
        var radioPeriodoSeleccionado = $('input[name=optionsRadio_i]:checked');
        if (radioPeriodoSeleccionado.length > 0) {
            var inputNumero = radioPeriodoSeleccionado.closest('.radio').find('input[type=number]');
    
            if (inputNumero.length > 0) {
                var numero = inputNumero.val();
                if (numero === "" || isNaN(parseFloat(numero)) || parseFloat(numero) <= 0) {
                    swal("Error", "Por favor ingrese un número válido mayor a 0 para el ciclo seleccionado", "error");
                    return;
                }
            }
        } else {
            swal("Error", "Por favor seleccione un ciclo", "error");
            return;
        }
    
        var data = {
            id,
            tipo_protocolo,
            periodicidad
        };
    
        var radioSeleccionado = $('input[name=optionsRadio_i]:checked');
    
        if (radioSeleccionado.length > 0) {
    
            var inputNumero = radioSeleccionado.closest('.radio').find('input[type=number]');
            var valorInput = parseFloat(inputNumero.val());
    
            if (!isNaN(valorInput)) {
                data.periodo = valorInput;
            } else {
                data.periodo = radioSeleccionado.val();
            }
        } else {
            data.periodo = periodo;
        }
    
        $.ajax({
            url: '/insert_fila',
            type: 'POST',
            data: data
        })
        .done(function(response) {
            if (response.success) {
                swal("¡Sapma!", "Fila insertada correctamente", "success");

            }
            setTimeout(function () {
                location.reload();
            }, 1000);	
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            var errorMessage = "Error en el servidor.";
            
            if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                // Mostrar mensaje de error específico enviado desde el servidor
                errorMessage = jqXHR.responseJSON.error;
            }
    
            swal("Error", errorMessage, "error");
        });
       
    }); 
    
    $('#duplicar').on('click', function () {

        var selectedRows = table.rows({ selected: true });

        if (selectedRows.count() !== 1) {
            swal("¡SAPMA!", "Debes seleccionar una fila para duplicar.", "error");
        }else{
            var idCiclo = table.row('.selected').data()[0];
            var nombreDetalle = table.row('.selected').data()[1];
            var tipoEquipo = table.row('.selected').data()[2];
            $('#titulo_duplicar').text('Duplicar ciclo');
            $('#id_duplicar').val(idCiclo)
            $('#nombre_duplicar').val(nombreDetalle);
            $('#tipo_equipo_duplicar').val(tipoEquipo);

            $.ajax({
                url: '/obtenerDetallesCiclo/' + idCiclo,
                type: 'GET',
                success: function (data) {

                    $.ajax({
                        url: '/ciclos_tequipo',
                        type: 'GET',
                        success: function (data){

                            var selectTIPO = $('#new_tipo_equipo_duplicar');
                            selectTIPO.empty();

                            selectTIPO.append('<option value="" disabled selected>Seleccione una opción</option>');
                            
                            data.forEach(function (tequi) {
                                var optionTIPO = $('<option>', {
                                    value: tequi.Id,
                                    text: tequi.Descripcion
                                });
                                selectTIPO.append(optionTIPO);
                            });

                        },
                        error: function (error){
                            console.log(error);
                        }
                    });
                    
                    $('#tabla_duplicar tbody').empty();
        
                    data.forEach(function (detalle) {
                        $('#tabla_duplicar tbody').append(
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

            $('#duplicar_ciclo').modal('show');
        }
    });

    $('#duplicar_ciclo').on('hidden.bs.modal', function () {
        $('#new_nombre_duplicar').val('');
    });

    $('#new_duplicar').on('click', function () {

        var nombre = $('#new_nombre_duplicar').val();
        var tipo_equipo = $('#new_tipo_equipo_duplicar').val();
        var id_duplicar = $('#id_duplicar').val();

        if (!nombre || !tipo_equipo){
            swal("Error", "Por favor asigne un nombre y seleccione un tipo de equipo para el nuevo ciclo.", "error");
            return;
        }

        var data = {
            id_duplicar,
            nombre,
            tipo_equipo
        }

        swal({
        title: "¡SAPMA!",
        text: "¿Desea duplicar el ciclo?",
        type: "warning",
        showCancelButton: true,
        confirmButtonClass: "btn-primary",
        confirmButtonText: "Si",
        cancelButtonText: "No",
        closeOnConfirm: false      
        },function(isConfirm) {
            if(isConfirm){
                $.ajax({
                    url: '/duplicar',
                    type: 'POST',
                    data: data,
                }).done(function(data){
                    swal({
                        title: "¡SAPMA!",
                        text: "Ciclo duplicado correctamente",
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

